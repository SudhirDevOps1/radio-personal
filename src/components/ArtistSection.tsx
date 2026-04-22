import { useState } from 'react';
import { Music } from 'lucide-react';
import type { Artist } from '@/types';
import { ARTISTS } from '@/data/artists';

interface Props {
  onArtistClick: (name: string) => void;
  darkMode: boolean;
}

const FALLBACK_COLORS = [
  'from-violet-500 to-purple-700',
  'from-pink-500 to-rose-700',
  'from-amber-500 to-orange-700',
  'from-cyan-500 to-blue-700',
  'from-emerald-500 to-green-700',
  'from-red-500 to-pink-700',
  'from-indigo-500 to-violet-700',
  'from-teal-500 to-cyan-700',
];

function ArtistCard({ artist, onClick, darkMode, idx }: {
  artist: Artist;
  onClick: () => void;
  darkMode: boolean;
  idx: number;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const colorClass = FALLBACK_COLORS[idx % FALLBACK_COLORS.length];

  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 w-28 flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 ${
        darkMode
          ? 'bg-white/5 hover:bg-white/15 border border-white/10 hover:border-violet-500/40'
          : 'bg-white/70 hover:bg-white border border-gray-200 hover:border-violet-400'
      }`}
    >
      <div className="relative w-16 h-16">
        {!imgFailed ? (
          <img
            src={artist.image}
            alt={artist.name}
            className="w-16 h-16 rounded-full object-cover ring-2 ring-violet-400/40 shadow-lg"
            onError={() => setImgFailed(true)}
            loading="lazy"
          />
        ) : (
          <div
            className={`w-16 h-16 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center ring-2 ring-violet-400/40 shadow-lg`}
          >
            <span className="text-white font-bold text-xl">
              {artist.name.charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center shadow">
          <Music className="w-2.5 h-2.5 text-white" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold leading-tight truncate w-full max-w-[96px]">{artist.name}</p>
        <p className="text-[10px] text-violet-400 mt-0.5 truncate w-full">{artist.genre}</p>
      </div>
    </button>
  );
}

export default function ArtistSection({ onArtistClick, darkMode }: Props) {
  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold flex items-center gap-2">
          🎤 Popular Artists
          <span className="text-xs font-normal text-gray-400 ml-1">({ARTISTS.length}+)</span>
        </h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {ARTISTS.map((artist, idx) => (
          <ArtistCard
            key={artist.id}
            artist={artist}
            onClick={() => onArtistClick(artist.searchQuery || artist.name + ' songs')}
            darkMode={darkMode}
            idx={idx}
          />
        ))}
      </div>
    </section>
  );
}
