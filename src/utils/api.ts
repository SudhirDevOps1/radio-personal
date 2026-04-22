import type { Song, SearchProvider } from '@/types';

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
    const cached = localStorage.getItem(getCacheKey(query));
    if (!cached) return null;
    const parsed: CachedResult = JSON.parse(cached);
    if (Date.now() - parsed.timestamp > CACHE_DURATION) {
      localStorage.removeItem(getCacheKey(query));
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function cacheResult(query: string, songs: Song[], provider: string): void {
  try {
    const entry: CachedResult = { data: songs, timestamp: Date.now(), provider };
    localStorage.setItem(getCacheKey(query), JSON.stringify(entry));
  } catch {
    // Ignore storage errors
  }
}

async function fetchWithTimeout(url: string, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

function formatDuration(seconds: number | string): string {
  if (!seconds) return '0:00';
  const n = typeof seconds === 'string' ? parseInt(seconds, 10) : Math.floor(seconds);
  if (!n || isNaN(n) || n <= 0) return '0:00';
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
}

function cleanTitle(raw: string): string {
  return (raw || 'Unknown')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

// ─── Piped ────────────────────────────────────────────────────────────────────
const PIPED_INSTANCES = [
  'https://pipedapi.adminforge.de',
  'https://pipedapi.astre.me',
  'https://pipedapi.projectsegfau.lt',
  'https://pipedapi.rivo.world',
  'https://pipedapi.mosesm.org',
  'https://piped-api.garudalinux.org',
  'https://pipedapi.kavin.rocks',
];

async function searchPiped(query: string): Promise<Song[]> {
  for (const base of PIPED_INSTANCES) {
    try {
      const url = `${base}/search?q=${encodeURIComponent(query)}&filter=videos`;
      const res = await fetchWithTimeout(url, 10000);
      if (!res.ok) continue;
      const data = await res.json();
      if (!Array.isArray(data?.items) || data.items.length === 0) continue;

      const songs: Song[] = data.items
        .filter((i: any) => i.url || i.id)
        .slice(0, 20)
        .map((i: any): Song => {
          let videoId = i.id || '';
          if (!videoId && i.url) {
            const m = i.url.match(/[?&]v=([^&]+)/) || i.url.match(/\/([a-zA-Z0-9_-]{11})$/);
            videoId = m ? m[1] : '';
          }
          videoId = videoId.replace(/^\/watch\?v=/, '').trim();
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
        console.log(`[Piped] ✓ ${songs.length} results from ${base}`);
        return songs;
      }
    } catch (e) {
      console.warn(`[Piped] ${base} failed:`, e);
    }
  }
  return [];
}

// ─── Invidious ────────────────────────────────────────────────────────────────
const INVIDIOUS_INSTANCES = [
  'https://invidious.projectsegfau.lt',
  'https://inv.vern.cc',
  'https://invidious.nerdvpn.de',
  'https://iv.melmac.space',
  'https://invidious.slipfox.xyz',
  'https://iv.ggtyler.dev',
  'https://inv.nadeko.net',
];

async function searchInvidious(query: string): Promise<Song[]> {
  for (const base of INVIDIOUS_INSTANCES) {
    try {
      const url = `${base}/api/v1/search?q=${encodeURIComponent(query)}&type=video&fields=videoId,title,author,lengthSeconds,videoThumbnails`;
      const res = await fetchWithTimeout(url, 10000);
      if (!res.ok) continue;
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) continue;

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
        console.log(`[Invidious] ✓ ${songs.length} results from ${base}`);
        return songs;
      }
    } catch (e) {
      console.warn(`[Invidious] ${base} failed:`, e);
    }
  }
  return [];
}

// ─── YouTube Data API v3 ──────────────────────────────────────────────────────
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

    const res = await fetchWithTimeout(url.toString(), 10000);
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

// ─── Main search export ───────────────────────────────────────────────────────
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
    console.log('[Cache] hit:', cached.length);
    return { songs: cached, provider: 'cache' };
  }

  // Build provider order
  const order: { name: string; fn: () => Promise<Song[]> }[] = [];

  if (provider === 'youtube' && apiKey) {
    order.push({ name: 'youtube', fn: () => searchYouTube(q, apiKey) });
    order.push({ name: 'piped',   fn: () => searchPiped(q) });
    order.push({ name: 'invidious', fn: () => searchInvidious(q) });
  } else if (provider === 'invidious') {
    order.push({ name: 'invidious', fn: () => searchInvidious(q) });
    order.push({ name: 'piped',    fn: () => searchPiped(q) });
  } else {
    // default: piped first
    order.push({ name: 'piped',    fn: () => searchPiped(q) });
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
  Object.keys(localStorage)
    .filter((k) => k.startsWith('music_search_'))
    .forEach((k) => localStorage.removeItem(k));
}
