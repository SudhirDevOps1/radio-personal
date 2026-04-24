import type { RadioStation } from '@/types';

const RADIO_BROWSER_HOSTS = [
    'https://de1.api.radio-browser.info',
    'https://nl1.api.radio-browser.info',
    'https://at1.api.radio-browser.info',
    'https://fr1.api.radio-browser.info',
];

// ─── In-Memory Cache ────────────────────────────────────────────────────────
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const radioCache = new Map<string, { data: RadioStation[]; timestamp: number }>();

function getCached(key: string): RadioStation[] | null {
    const entry = radioCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
        radioCache.delete(key);
        return null;
    }
    return entry.data;
}

function setCache(key: string, data: RadioStation[]): void {
    radioCache.set(key, { data, timestamp: Date.now() });
    // Prevent memory bloat
    if (radioCache.size > 50) {
        const oldest = [...radioCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
        if (oldest) radioCache.delete(oldest[0]);
    }
}

// ─── Network ────────────────────────────────────────────────────────────────
async function fetchWithTimeout(url: string, timeout = 6000): Promise<Response> {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeout);
    try {
        const res = await fetch(url, {
            signal: ac.signal,
            headers: { Accept: 'application/json', 'User-Agent': 'PrivMITLab/1.0' },
        });
        clearTimeout(timer);
        return res;
    } catch (e) {
        clearTimeout(timer);
        throw e;
    }
}

// Race all hosts in parallel — return first successful response
async function fetchRadio(path: string): Promise<any[]> {
    const promises = RADIO_BROWSER_HOSTS.map(async (host) => {
        const res = await fetchWithTimeout(`${host}${path}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) throw new Error('Empty');
        return data;
    });

    try {
        // Promise.any → resolves as soon as ONE promise fulfills
        return await Promise.any(promises);
    } catch {
        // All hosts failed
        console.warn('[Radio] All hosts failed for path:', path);
        return [];
    }
}

// ─── Sanitize & Deduplicate ────────────────────────────────────────────────
function sanitize(stations: any[]): RadioStation[] {
    const seen = new Set<string>();

    return stations
        .filter((s) => s.url_resolved || s.url)
        .filter((s) => {
            const url = s.url_resolved || s.url;
            if (seen.has(url)) return false;
            seen.add(url);
            return true;
        })
        .map((s, index) => ({
            stationuuid: s.stationuuid || s.id || `station_${index}`,
            name: (s.name || 'Unknown Station').trim(),
            url: s.url || '',
            url_resolved: s.url_resolved || s.url || '',
            favicon: s.favicon || '',
            tags: s.tags || '',
            country: s.country || '',
            language: s.language || '',
            bitrate: Number(s.bitrate) || 0,
            codec: s.codec || 'MP3',
            votes: Number(s.votes) || 0,
            clickcount: Number(s.clickcount) || 0,
            clicktrend: Number(s.clicktrend) || 0,
        }));
}

// ─── API Functions ──────────────────────────────────────────────────────────
export async function getTopStations(limit = 50): Promise<RadioStation[]> {
    const key = `top_${limit}`;
    const cached = getCached(key);
    if (cached) return cached;

    const data = await fetchRadio(`/json/stations/topclick/${limit}`);
    const result = sanitize(data);
    setCache(key, result);
    return result;
}

export async function searchStations(query: string, limit = 50): Promise<RadioStation[]> {
    const key = `search_${query}_${limit}`;
    const cached = getCached(key);
    if (cached) return cached;

    const data = await fetchRadio(
        `/json/stations/search?name=${encodeURIComponent(query)}&limit=${limit}&order=clickcount&reverse=true`,
    );
    const result = sanitize(data);
    setCache(key, result);
    return result;
}

export async function getStationsByCountry(country: string, limit = 50): Promise<RadioStation[]> {
    const key = `country_${country}_${limit}`;
    const cached = getCached(key);
    if (cached) return cached;

    const data = await fetchRadio(
        `/json/stations/bycountry/${encodeURIComponent(country)}?limit=${limit}&order=clickcount&reverse=true`,
    );
    const result = sanitize(data);
    setCache(key, result);
    return result;
}

export async function getStationsByLanguage(lang: string, limit = 50): Promise<RadioStation[]> {
    const key = `lang_${lang}_${limit}`;
    const cached = getCached(key);
    if (cached) return cached;

    const data = await fetchRadio(
        `/json/stations/bylanguage/${encodeURIComponent(lang)}?limit=${limit}&order=clickcount&reverse=true`,
    );
    const result = sanitize(data);
    setCache(key, result);
    return result;
}

export async function getStationsByTag(tag: string, limit = 50): Promise<RadioStation[]> {
    const key = `tag_${tag}_${limit}`;
    const cached = getCached(key);
    if (cached) return cached;

    const data = await fetchRadio(
        `/json/stations/bytag/${encodeURIComponent(tag)}?limit=${limit}&order=clickcount&reverse=true`,
    );
    const result = sanitize(data);
    setCache(key, result);
    return result;
}

// ─── Curated Categories ────────────────────────────────────────────────────
export const RADIO_CATEGORIES = [
    { id: 'bollywood', label: '🎬 Bollywood', query: 'bollywood', type: 'tag' },
    { id: 'hindi', label: '🇮🇳 Hindi', query: 'hindi', type: 'language' },
    { id: 'bhojpuri', label: '🎤 Bhojpuri', query: 'bhojpuri', type: 'tag' },
    { id: 'punjabi', label: '🥁 Punjabi', query: 'punjabi', type: 'tag' },
    { id: 'classical', label: '🎻 Classical', query: 'classical', type: 'tag' },
    { id: 'devotional', label: '🕉️ Devotional', query: 'devotional', type: 'tag' },
    { id: 'pop', label: '🎵 Pop', query: 'pop', type: 'tag' },
    { id: 'news', label: '📰 News', query: 'news', type: 'tag' },
    { id: 'english', label: '🌍 English', query: 'english', type: 'language' },
    { id: 'top', label: '🔥 Top Stations', query: 'top', type: 'top' },
];
