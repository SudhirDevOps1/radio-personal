import type { Artist } from '@/types';

// ─── In-Memory + Session Cache ────────────────────────────
const memoryCache = new Map<string, string>();
const CACHE_KEY = 'artist_images_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  url: string;
  timestamp: number;
}

function loadSessionCache(): Map<string, CacheEntry> {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as Record<string, CacheEntry>;
    const map = new Map<string, CacheEntry>();
    const now = Date.now();
    for (const [k, v] of Object.entries(parsed)) {
      if (now - v.timestamp < CACHE_TTL) map.set(k, v);
    }
    return map;
  } catch {
    return new Map();
  }
}

function saveSessionCache(map: Map<string, CacheEntry>): void {
  try {
    const obj: Record<string, CacheEntry> = {};
    map.forEach((v, k) => { obj[k] = v; });
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(obj));
  } catch {}
}

// ─── Deezer API Fetch ─────────────────────────────────────
async function fetchFromDeezer(name: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=1`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return null;
    const data = await res.json();
    // picture_medium = 250x250, picture_big = 500x500
    return data.data?.[0]?.picture_big ?? data.data?.[0]?.picture_medium ?? null;
  } catch {
    return null;
  }
}

// ─── Public Resolver ──────────────────────────────────────
export async function resolveArtistImages(
  artists: Artist[],
  onProgress?: (resolved: Record<string, string>) => void,
): Promise<Record<string, string>> {
  const sessionCache = loadSessionCache();
  const resolved: Record<string, string> = {};

  // Batch process — 5 at a time to avoid rate limits
  const BATCH = 5;
  for (let i = 0; i < artists.length; i += BATCH) {
    const batch = artists.slice(i, i + BATCH);

    await Promise.allSettled(
      batch.map(async (artist) => {
        const key = artist.name.toLowerCase().trim();

        // 1. Memory cache
        if (memoryCache.has(key)) {
          resolved[artist.id] = memoryCache.get(key)!;
          return;
        }

        // 2. Session cache
        const cached = sessionCache.get(key);
        if (cached) {
          memoryCache.set(key, cached.url);
          resolved[artist.id] = cached.url;
          return;
        }

        // 3. If artist has a real URL (not empty, not placeholder), try it
        if (artist.image && !artist.image.includes('placeholder') && artist.image.startsWith('http')) {
          // Trust it — if it works, great. Component will fallback if it doesn't.
          resolved[artist.id] = artist.image;
          memoryCache.set(key, artist.image);
          sessionCache.set(key, { url: artist.image, timestamp: Date.now() });
          return;
        }

        // 4. Fetch from Deezer
        const deezerUrl = await fetchFromDeezer(artist.name);
        if (deezerUrl) {
          resolved[artist.id] = deezerUrl;
          memoryCache.set(key, deezerUrl);
          sessionCache.set(key, { url: deezerUrl, timestamp: Date.now() });
          return;
        }

        // 5. No image found — component will show SVG avatar
        resolved[artist.id] = '';
      }),
    );

    onProgress?.({ ...resolved });
  }

  saveSessionCache(sessionCache);
  return resolved;
}

// ─── SVG Avatar Generator (zero network) ──────────────────
const COLORS: [string, string][] = [
  ['#7c3aed', '#a855f7'], ['#ec4899', '#f472b6'], ['#f59e0b', '#fbbf24'],
  ['#06b6d4', '#22d3ee'], ['#10b981', '#34d399'], ['#ef4444', '#f87171'],
  ['#6366f1', '#818cf8'], ['#14b8a6', '#2dd4bf'], ['#8b5cf6', '#c084fc'],
  ['#f97316', '#fb923c'],
];

export function generateAvatarDataUri(name: string): string {
  const initial = (name?.[0] || '?').toUpperCase();
  const [c1, c2] = COLORS[(name?.charCodeAt(0) ?? 0) % COLORS.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
    <defs><linearGradient id="g" x1="0" y1="0" x2="200" y2="200">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient></defs>
    <rect width="200" height="200" rx="100" fill="url(#g)"/>
    <text x="100" y="118" text-anchor="middle" fill="white" font-family="system-ui,sans-serif" font-size="90" font-weight="700">${initial}</text>
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
