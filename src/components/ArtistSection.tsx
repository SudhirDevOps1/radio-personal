import { useState, memo, useCallback, useMemo } from 'react';
import { Music } from 'lucide-react';
import type { Artist } from '@/types';
import { ARTISTS } from '@/data/artists';

// ─── Generate SVG avatar as data URI (ZERO network, ALWAYS works) ──────
const GRADIENT_PAIRS: [string, string][] = [
  ['#7c3aed', '#a855f7'],
  ['#ec4899', '#f472b6'],
  ['#f59e0b', '#fbbf24'],
  ['#06b6d4', '#22d3ee'],
  ['#10b981', '#34d399'],
  ['#ef4444', '#f87171'],
  ['#6366f1', '#818cf8'],
  ['#14b8a6', '#2dd4bf'],
  ['#8b5cf6', '#c084fc'],
  ['#f97316', '#fb923c'],
];

function generateAvatarDataUri(name: string): string {
  const initial = (name?.charAt(0) || '?').toUpperCase();
  const idx = name ? name.charCodeAt(0) % GRADIENT_PAIRS.length : 0;
  const [c1, c2] = GRADIENT_PAIRS[idx];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="176" height="176">
    <defs><linearGradient id="g" x1="0" y1="0" x2="176" y2="176">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient></defs>
    <rect width="176" height="176" rx="88" fill="url(#g)"/>
    <text x="88" y="100" text-anchor="middle" fill="white" font-family="system-ui,sans-serif" font-size="80" font-weight="700">${initial}</text>
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// ─── Memoized Card ──────────────────────────────────────────────────────
const ArtistCard = memo(function ArtistCard({
  artist,
  onArtistClick,
  query,
  darkMode,
  idx,
}: {
  artist: Artist;
  onArtistClick: (name: string) => void;
  query: string;
  darkMode: boolean;
  idx: number;
}) {
  const [imgFailed, setImgFailed] = useState(false);

  const handleClick = useCallback(() => onArtistClick(query), [onArtistClick, query]);
  const handleImgError = useCallback(() => setImgFailed(true), []);

  // Pre-generate fallback avatar (no network needed!)
  const fallbackSrc = useMemo(() => generateAvatarDataUri(artist.name), [artist.name]);

  const imgSrc = imgFailed ? fallbackSrc : artist.image;

  return (
    <button
      onClick={handleClick}
      aria-label={`Play ${artist.name} music`}
      className={`flex-shrink-0 w-28 flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 transform-gpu ${
        darkMode
          ? 'bg-white/5 hover:bg-white/15 border border-white/10 hover:border-violet-500/40'
          : 'bg-white/70 hover:bg-white border border-gray-200 hover:border-violet-400'
      }`}
    >
      <div className="relative w-16 h-16">
        <img
          src={imgSrc}
          alt={artist.name}
          className="w-16 h-16 rounded-full object-cover ring-2 ring-violet-400/40 shadow-lg"
          onError={handleImgError}
          /* ⚠️ NO loading="lazy" — horizontal scroll me lazy load BUG hai,
             browser images ko "near viewport" nahi samajhta toh load hi nahi karta */
          decoding="async"
          draggable={false}
        />
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center shadow">
          <Music className="w-2.5 h-2.5 text-white" />
        </div>
      </div>
      <div className="text-center w-full">
        <p className="text-xs font-semibold leading-tight truncate max-w-[96px] mx-auto">
          {artist.name}
        </p>
        {artist.genre && (
          <p className="text-[10px] text-violet-400 mt-0.5 truncate max-w-[96px] mx-auto">
            {artist.genre}
          </p>
        )}
      </div>
    </button>
  );
});

// ─── Main Section ───────────────────────────────────────────────────────
export default function ArtistSection({ onArtistClick, darkMode }: Props) {
  if (!ARTISTS?.length) return null;

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold flex items-center gap-2">
          🎤 Popular Artists
          <span className="text-xs font-normal text-gray-400 ml-1">
            ({ARTISTS.length}+)
          </span>
        </h2>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {ARTISTS.map((artist, idx) => (
          <ArtistCard
            key={artist.id}
            artist={artist}
            onArtistClick={onArtistClick}
            query={artist.searchQuery || `${artist.name} songs`}
            darkMode={darkMode}
            idx={idx}
          />
        ))}
      </div>
    </section>
  );
}
