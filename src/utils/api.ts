import type { Song, SearchProvider } from '@/types';

// ─── Cache ──────────────────────────────────────────────────────────────────
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CachedResult {
  data: Song[];
  timestamp: number;
  provider: string;
}

function getCacheKey(query: string): string {
  return `music_search_${query.toLowerCase().trim().replace(/\s+/g, '_')}`;
}

function getCachedResult(query: string): Song[] | null {
  try {
    const key = getCacheKey(query);
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const parsed: CachedResult = JSON.parse(cached);
    if (Date.now() - parsed.timestamp > CACHE_DURATION) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function cacheResult(query: string, songs: Song[], provider: string): void {
  try {
    localStorage.setItem(
      getCacheKey(query),
      JSON.stringify({ data: songs, timestamp: Date.now(), provider }),
    );
  } catch {
    // storage full
  }
}

// ─── Instance Health Tracker ────────────────────────────────────────────────
const HEALTH_KEY = 'music_instance_health';

interface HealthScore {
  piped: Record<string, number>;
  invidious: Record<string, number>;
}

function getHealth(): HealthScore {
  try {
    const raw = localStorage.getItem(HEALTH_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { piped: {}, invidious: {} };
}

function saveHealth(h: HealthScore): void {
  try {
    localStorage.setItem(HEALTH_KEY, JSON.stringify(h));
  } catch {}
}

function recordSuccess(type: 'piped' | 'invidious', base: string): void {
  const h = getHealth();
  if (!h[type]) h[type] = {};
  h[type][base] = (h[type][base] || 0) + 1;
  saveHealth(h);
}

function recordFail(type: 'piped' | 'invidious', base: string): void {
  const h = getHealth();
  if (!h[type]) h[type] = {};
  h[type][base] = Math.max((h[type][base] || 0) - 1, -5);
  saveHealth(h);
}

function sortInstancesByHealth(instances: string[], type: 'piped' | 'invidious'): string[] {
  const h = getHealth();
  const scores = h[type] || {};
  return [...instances].sort((a, b) => (scores[b] || 0) - (scores[a] || 0));
}

// ─── Network ────────────────────────────────────────────────────────────────
async function fetchWithTimeout(url: string, timeout = 6000): Promise<Response> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatDuration(seconds: number | string): string {
  if (!seconds) return '0:00';
  const n = typeof seconds === 'string' ? parseInt(seconds, 10) : Math.floor(seconds);
  if (!n || isNaN(n) || n <= 0) return '0:00';
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
}

const ENT_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
};
const ENT_RE = /&(?:amp|lt|gt|quot|#39);/g;

function cleanTitle(raw: string): string {
  return (raw || 'Unknown').replace(ENT_RE, (m) => ENT_MAP[m] || m).trim();
}

function extractVideoId(item: { id?: string; url?: string }): string {
  let vid = item.id || '';
  if (!vid && item.url) {
    const m = item.url.match(/[?&]v=([^&]+)/) || item.url.match(/\/([a-zA-Z0-9_-]{11})$/);
    vid = m ? m[1] : '';
  }
  return vid.replace(/^\/watch\?v=/, '').trim();
}

// ─── Parallel Race Helper ───────────────────────────────────────────────────
// Runs multiple async tasks, returns first successful non-empty result
function raceFirst<T>(
  tasks: Promise<T>[],
  isValid: (r: T) => boolean,
): Promise<T | null> {
  return new Promise((resolve) => {
    if (tasks.length === 0) { resolve(null); return; }
    let done = false;
    let pending = tasks.length;

    for (const task of tasks) {
      task
        .then((result) => {
          if (!done) {
            if (isValid(result)) {
              done = true;
              resolve(result);
            } else {
              pending--;
              if (pending === 0) resolve(null);
            }
          }
        })
        .catch(() => {
          if (!done) {
            pending--;
            if (pending === 0) resolve(null);
          }
        });
    }
  });
}

// ─── Piped ──────────────────────────────────────────────────────────────────
const PIPED_INSTANCES = [
  'https://pipedapi.adminforge.de',
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.r4fo.com',
  'https://api.piped.yt',
  'https://pipedapi.astre.me',
  'https://pipedapi.projectsegfau.lt',
  'https://piped-api.garudalinux.org',
  'https://pipedapi.mosesm.org',
  'https://pipedapi.rivo.world',
];

async function tryPiped(base: string, encoded: string): Promise<Song[]> {
  try {
    const res = await fetchWithTimeout(`${base}/search?q=${encoded}&filter=videos`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data?.items) || data.items.length === 0) return [];

    const songs: Song[] = data.items
      .filter((i: any) => i.url || i.id)
      .slice(0, 20)
      .map((i: any): Song => {
        const videoId = extractVideoId(i);
        return {
          videoId,
          title: cleanTitle(i.title),
          artist: cleanTitle(i.uploaderName || i.uploader || 'Unknown Artist'),
          thumbnail: i.thumbnail || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
          duration: i.duration ? formatDuration(i.duration) : '0:00',
          durationSeconds: typeof i.duration === 'number' ? Math.floor(i.duration) : 0,
        };
      })
      .filter((s: Song) => s.videoId && s.videoId.length >= 8);

    if (songs.length > 0) {
      recordSuccess('piped', base);
      console.log(`[Piped] ✓ ${songs.length} from ${base}`);
    }
    return songs;
  } catch {
    recordFail('piped', base);
    console.warn(`[Piped] ✗ ${base}`);
    return [];
  }
}

async function searchPiped(query: string): Promise<Song[]> {
  const encoded = encodeURIComponent(query);
  const sorted = sortInstancesByHealth(PIPED_INSTANCES, 'piped');

  // Batch 1: race top 3 (health-sorted) in parallel
  const batch1 = await raceFirst(
    sorted.slice(0, 3).map((b) => tryPiped(b, encoded)),
    (r): r is Song[] => Array.isArray(r) && r.length > 0,
  );
  if (batch1) return batch1;

  // Batch 2: race next 3
  const batch2 = await raceFirst(
    sorted.slice(3, 6).map((b) => tryPiped(b, encoded)),
    (r): r is Song[] => Array.isArray(r) && r.length > 0,
  );
  if (batch2) return batch2;

  // Batch 3: remaining sequentially (last resort)
  for (const base of sorted.slice(6)) {
    const songs = await tryPiped(base, encoded);
    if (songs.length > 0) return songs;
  }

  return [];
}

// ─── Invidious ──────────────────────────────────────────────────────────────
const INVIDIOUS_INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
  'https://iv.melmac.space',
  'https://iv.ggtyler.dev',
  'https://invidious.projectsegfau.lt',
  'https://inv.vern.cc',
  'https://invidious.privacyredirect.com',
  'https://invidious.slipfox.xyz',
];

async function tryInvidious(base: string, encoded: string): Promise<Song[]> {
  try {
    const res = await fetchWithTimeout(
      `${base}/api/v1/search?q=${encoded}&type=video&fields=videoId,title,author,lengthSeconds,videoThumbnails`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return [];

    const songs: Song[] = data
      .filter((i: any) => i.videoId && i.title)
      .slice(0, 20)
      .map((i: any): Song => {
        const thumb =
          i.videoThumbnails?.find((t: any) => t.quality === 'medium')?.url ||
          i.videoThumbnails?.[0]?.url ||
          `https://i.ytimg.com/vi/${i.videoId}/mqdefault.jpg`;
        return {
          videoId: i.videoId,
          title: cleanTitle(i.title),
          artist: cleanTitle(i.author || 'Unknown Artist'),
          thumbnail: thumb.startsWith('//') ? `https:${thumb}` : thumb,
          duration: i.lengthSeconds ? formatDuration(i.lengthSeconds) : '0:00',
          durationSeconds: i.lengthSeconds || 0,
        };
      });

    if (songs.length > 0) {
      recordSuccess('invidious', base);
      console.log(`[Invidious] ✓ ${songs.length} from ${base}`);
    }
    return songs;
  } catch {
    recordFail('invidious', base);
    console.warn(`[Invidious] ✗ ${base}`);
    return [];
  }
}

async function searchInvidious(query: string): Promise<Song[]> {
  const encoded = encodeURIComponent(query);
  const sorted = sortInstancesByHealth(INVIDIOUS_INSTANCES, 'invidious');

  // Batch 1: race top 3
  const batch1 = await raceFirst(
    sorted.slice(0, 3).map((b) => tryInvidious(b, encoded)),
    (r): r is Song[] => Array.isArray(r) && r.length > 0,
  );
  if (batch1) return batch1;

  // Batch 2: race next 3
  const batch2 = await raceFirst(
    sorted.slice(3, 6).map((b) => tryInvidious(b, encoded)),
    (r): r is Song[] => Array.isArray(r) && r.length > 0,
  );
  if (batch2) return batch2;

  // Batch 3: remaining
  for (const base of sorted.slice(6)) {
    const songs = await tryInvidious(base, encoded);
    if (songs.length > 0) return songs;
  }

  return [];
}

// ─── YouTube Data API v3 ────────────────────────────────────────────────────
async function searchYouTube(query: string, apiKey: string): Promise<Song[]> {
  if (!apiKey) return [];
  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('q', query);
    url.searchParams.set('type', 'video');
    url.searchParams.set('videoCategoryId', '10'); // Music
    url.searchParams.set('maxResults', '20');
    url.searchParams.set('key', apiKey);

    const res = await fetchWithTimeout(url.toString(), 8000);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `HTTP ${res.status}`);
    }
    const data = await res.json();
    if (!Array.isArray(data?.items)) throw new Error('Invalid YouTube response');

    const songs: Song[] = data.items
      .filter((i: any) => i.id?.videoId)
      .map((i: any): Song => ({
        videoId: i.id.videoId,
        title: cleanTitle(i.snippet?.title),
        artist: cleanTitle(i.snippet?.channelTitle || 'Unknown Artist'),
        thumbnail:
          i.snippet?.thumbnails?.high?.url ||
          i.snippet?.thumbnails?.medium?.url ||
          `https://i.ytimg.com/vi/${i.id.videoId}/mqdefault.jpg`,
        duration: '0:00',
        durationSeconds: 0,
      }));

    console.log(`[YouTube] ✓ ${songs.length} results`);
    return songs;
  } catch (e) {
    console.error('[YouTube] search error:', e);
    return [];
  }
}

// ─── Main search export ────────────────────────────────────────────────────
export async function searchSongs(
  query: string,
  apiKey = '',
  provider: SearchProvider = 'piped',
): Promise<{ songs: Song[]; provider: string }> {
  if (!query?.trim()) return { songs: [], provider: 'none' };

  const q = query.trim();

  // Cache hit
  const cached = getCachedResult(q);
  if (cached?.length) {
    console.log('[Cache] ✓ hit:', cached.length);
    return { songs: cached, provider: 'cache' };
  }

  // Build provider order
  const order: { name: string; fn: () => Promise<Song[]> }[] = [];

  if (provider === 'youtube' && apiKey) {
    order.push({ name: 'youtube', fn: () => searchYouTube(q, apiKey) });
    order.push({ name: 'piped', fn: () => searchPiped(q) });
    order.push({ name: 'invidious', fn: () => searchInvidious(q) });
  } else if (provider === 'invidious') {
    order.push({ name: 'invidious', fn: () => searchInvidious(q) });
    order.push({ name: 'piped', fn: () => searchPiped(q) });
  } else {
    // default: piped first
    order.push({ name: 'piped', fn: () => searchPiped(q) });
    order.push({ name: 'invidious', fn: () => searchInvidious(q) });
  }

  // Always append YouTube as last resort if key available and not already first
  if (apiKey && provider !== 'youtube') {
    order.push({ name: 'youtube', fn: () => searchYouTube(q, apiKey) });
  }

  for (const p of order) {
    try {
      const songs = await p.fn();
      if (songs.length > 0) {
        cacheResult(q, songs, p.name);
        return { songs, provider: p.name };
      }
    } catch (e) {
      console.error(`[${p.name}] error:`, e);
    }
  }

  return { songs: [], provider: 'failed' };
}

export function clearSearchCache(): void {
  const keys = Object.keys(localStorage);
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].startsWith('music_search_') || keys[i] === 'music_instance_health') {
      localStorage.removeItem(keys[i]);
    }
  }
}
