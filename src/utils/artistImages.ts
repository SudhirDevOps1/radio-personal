import type { Artist } from '@/types';

// ─── Caching ──────────────────────────────────────────────
const memoryCache = new Map<string, string>();
const CACHE_KEY = 'artist_images_v2';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry {
  url: string;
  ts: number;
}

function loadCache(): Map<string, CacheEntry> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as Record<string, CacheEntry>;
    const map = new Map<string, CacheEntry>();
    const now = Date.now();
    for (const [k, v] of Object.entries(parsed)) {
      if (now - v.ts < CACHE_TTL) map.set(k, v);
    }
    return map;
  } catch {
    return new Map();
  }
}

function saveCache(map: Map<string, CacheEntry>): void {
  try {
    const obj: Record<string, CacheEntry> = {};
    let count = 0;
    map.forEach((v, k) => {
      if (count < 200) { obj[k] = v; count++; }
    });
    localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
  } catch {
    // localStorage full — clear old cache
    try { localStorage.removeItem(CACHE_KEY); } catch {}
  }
}

// ─── JSONP Fetch for Deezer (bypasses CORS) ──────────────
function fetchDeezerImage(name: string): Promise<string | null> {
  return new Promise((resolve) => {
    const cbName = `_dz_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const timer = setTimeout(() => { cleanup(); resolve(null); }, 6000);

    function cleanup() {
      clearTimeout(timer);
      delete (window as any)[cbName];
      const el = document.querySelector(`script[data-cb="${cbName}"]`);
      if (el) el.remove();
    }

    (window as any)[cbName] = (data: any) => {
      cleanup();
      try {
        const url = data?.data?.[0]?.picture_xl
          ?? data?.data?.[0]?.picture_big
          ?? data?.data?.[0]?.picture_medium
          ?? null;
        resolve(url);
      } catch {
        resolve(null);
      }
    };

    const script = document.createElement('script');
    script.setAttribute('data-cb', cbName);
    script.src = `https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=1&output=jsonp&callback=${cbName}`;
    script.onerror = () => { cleanup(); resolve(null); };
    document.head.appendChild(script);
  });
}

// ─── Image URL Validator (head check) ─────────────────────
async function isUrlValid(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors', // won't read body, just check no network error
      signal: AbortSignal.timeout(3000),
    });
    return res.type === 'opaque' || res.ok;
  } catch {
    return false;
  }
}

// ─── Public: Resolve All Artist Images ────────────────────
export async function resolveArtistImages(
  artists: Artist[],
  onProgress?: (resolved: Record<string, string>) => void,
): Promise<Record<string, string>> {
  const cache = loadCache();
  const resolved: Record<string, string> = {};
  const toFetch: Artist[] = [];

  // Phase 1: Check cache + valid existing URLs
  for (const artist of artists) {
    const key = artist.name.toLowerCase().trim();

    // Memory cache
    if (memoryCache.has(key)) {
      resolved[artist.id] = memoryCache.get(key)!;
      continue;
    }

    // LocalStorage cache
    const cached = cache.get(key);
    if (cached?.url) {
      memoryCache.set(key, cached.url);
      resolved[artist.id] = cached.url;
      continue;
    }

    // Has a non-empty, non-placeholder URL
    if (artist.image && !artist.image.includes('placeholder') && artist.image.startsWith('http')) {
      resolved[artist.id] = artist.image;
      memoryCache.set(key, artist.image);
      cache.set(key, { url: artist.image, ts: Date.now() });
      continue;
    }

    // Needs Deezer fetch
    toFetch.push(artist);
  }

  onProgress?.({ ...resolved });

  // Phase 2: Fetch missing images via JSONP (3 at a time)
  const BATCH = 3;
  for (let i = 0; i < toFetch.length; i += BATCH) {
    const batch = toFetch.slice(i, i + BATCH);

    await Promise.allSettled(
      batch.map(async (artist) => {
        const key = artist.name.toLowerCase().trim();

        // Try Deezer
        let url = await fetchDeezerImage(artist.name);

        // If Deezer fails, try with shorter name (e.g., "AR Rahman" → "A R Rahman")
        if (!url && artist.name.includes('.')) {
          const altName = artist.name.replace(/\./g, ' ');
          url = await fetchDeezerImage(altName);
        }

        // If Deezer fails, try without special chars
        if (!url) {
          const cleanName = artist.name.replace(/[^a-zA-Z\s]/g, '').trim();
          if (cleanName !== artist.name) {
            url = await fetchDeezerImage(cleanName);
          }
        }

        if (url) {
          resolved[artist.id] = url;
          memoryCache.set(key, url);
          cache.set(key, { url, ts: Date.now() });
        } else {
          resolved[artist.id] = '';
        }
      }),
    );

    onProgress?.({ ...resolved });
  }

  saveCache(cache);
  return resolved;
}

// ─── SVG Avatar (zero network, never fails) ───────────────
const PAIRS: [string, string][] = [
  ['#7c3aed', '#a855f7'], ['#ec4899', '#f472b6'], ['#f59e0b', '#fbbf24'],
  ['#06b6d4', '#22d3ee'], ['#10b981', '#34d399'], ['#ef4444', '#f87171'],
  ['#6366f1', '#818cf8'], ['#14b8a6', '#2dd4bf'], ['#8b5cf6', '#c084fc'],
  ['#f97316', '#fb923c'], ['#3b82f6', '#60a5fa'], ['#84cc16', '#a3e635'],
];

export function generateAvatarDataUri(name: string): string {
  const initial = (name?.[0] || '?').toUpperCase();
  const [c1, c2] = PAIRS[(name?.charCodeAt(0) ?? 0) % PAIRS.length];

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
