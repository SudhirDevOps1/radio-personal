import { useState } from 'react';
import { Play, Plus, Heart, Music } from 'lucide-react';
import type { Song } from '@/types';

interface Props {
  song: Song;
  isPlaying?: boolean;
  isCurrent?: boolean;
  isFavorite?: boolean;
  isCached?: boolean;
  onPlay: (song: Song) => void;
  onAddToQueue: (song: Song) => void;
  onToggleFavorite: (song: Song) => void;
  darkMode: boolean;
}

export default function SongCard({
  song,
  isPlaying,
  isCurrent,
  isFavorite,
  isCached,
  onPlay,
  onAddToQueue,
  onToggleFavorite,
  darkMode,
}: Props) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${
        isCurrent
          ? 'bg-violet-500/20 border border-violet-500/50'
          : darkMode
          ? 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-500/30'
          : 'bg-white/60 hover:bg-white border border-gray-200 hover:border-violet-400/50'
      }`}
    >
      {/* Thumbnail */}
      <div className="relative flex-shrink-0">
        {!imgError ? (
          <img
            src={song.thumbnail}
            alt={song.title}
            className="w-14 h-14 rounded-lg object-cover"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center">
            <Music className="w-6 h-6 text-white" />
          </div>
        )}
        {isCurrent && isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
            <div className="flex gap-0.5 items-end h-5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1 bg-violet-400 rounded-sm"
                  style={{
                    animation: `barBounce 0.8s ${i * 0.15}s ease-in-out infinite alternate`,
                    height: `${40 + i * 20}%`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
        <button
          onClick={() => onPlay(song)}
          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={`Play ${song.title}`}
        >
          <Play className="w-6 h-6 text-white fill-white" />
        </button>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm truncate ${isCurrent ? 'text-violet-400' : ''}`}>
          {song.title}
        </p>
        <p className={`text-xs truncate mt-0.5 ${darkMode ? 'text-white/50' : 'text-gray-500'}`}>
          {song.artist}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {song.duration !== '0:00' && (
            <span className="text-[10px] text-gray-400">{song.duration}</span>
          )}
          {isCached && (
            <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
              💾 Cached
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onToggleFavorite(song)}
          className={`p-2 rounded-full transition-colors ${
            isFavorite
              ? 'text-pink-500'
              : darkMode
              ? 'hover:bg-white/10 text-white/40'
              : 'hover:bg-gray-100 text-gray-400'
          }`}
          aria-label="Toggle favorite"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-pink-500' : ''}`} />
        </button>
        <button
          onClick={() => onAddToQueue(song)}
          className={`p-2 rounded-full transition-colors ${
            darkMode ? 'hover:bg-white/10 text-white/40' : 'hover:bg-gray-100 text-gray-400'
          }`}
          aria-label="Add to queue"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPlay(song)}
          className="p-2 bg-violet-500 hover:bg-violet-600 rounded-full transition-colors"
          aria-label={`Play ${song.title}`}
        >
          <Play className="w-4 h-4 text-white fill-white" />
        </button>
      </div>
    </div>
  );
}
