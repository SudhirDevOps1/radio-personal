import { memo, useCallback, useState } from 'react';
import { Play, X, ListMusic, Music } from 'lucide-react';
import type { Song } from '@/types';

interface Props {
  queue: Song[];
  currentSong: Song | null;
  darkMode: boolean;
  onPlay: (song: Song) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
  onClose: () => void;
}

// ─── Memoized Queue Item ────────────────────────────────────────────────────
const QueueItem = memo(function QueueItem({
  song,
  idx,
  isActive,
  darkMode,
  onPlay,
  onRemove,
}: {
  song: Song;
  idx: number;
  isActive: boolean;
  darkMode: boolean;
  onPlay: (song: Song) => void;
  onRemove: (index: number) => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);

  const handlePlay = useCallback(() => onPlay(song), [onPlay, song]);
  const handleRemove = useCallback(() => onRemove(idx), [onRemove, idx]);
  const handleImgError = useCallback(() => setImgFailed(true), []);

  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-xl transition-all group transform-gpu ${
        isActive
          ? 'bg-violet-500/20 border border-violet-500/40'
          : darkMode
          ? 'hover:bg-white/5'
          : 'hover:bg-gray-50'
      }`}
    >
      <span className="text-xs w-5 text-center text-gray-400 flex-shrink-0">{idx + 1}</span>
      <div className="w-9 h-9 rounded-lg flex-shrink-0 overflow-hidden">
        {!imgFailed ? (
          <img
            src={song.thumbnail}
            alt={song.title}
            className="w-full h-full object-cover"
            onError={handleImgError}
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center">
            <Music className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium truncate ${isActive ? 'text-violet-400' : ''}`}>
          {song.title}
        </p>
        <p className="text-[10px] text-gray-400 truncate">{song.artist}</p>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handlePlay}
          aria-label={`Play ${song.title}`}
          className="p-1 hover:text-violet-400 transition-colors"
        >
          <Play className="w-3 h-3 fill-current" />
        </button>
        <button
          onClick={handleRemove}
          aria-label={`Remove ${song.title} from queue`}
          className="p-1 hover:text-red-400 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
});

// ─── Main Panel ─────────────────────────────────────────────────────────────
export default memo(function QueuePanel({
  queue,
  currentSong,
  darkMode,
  onPlay,
  onRemove,
  onClear,
  onClose,
}: Props) {
  const card = darkMode
    ? 'bg-slate-900/98 border-white/10'
    : 'bg-white/98 border-gray-200';

  return (
    <div
      role="dialog"
      aria-label="Queue"
      className={`fixed right-0 top-16 bottom-20 md:bottom-28 w-full md:w-80 ${card} border-l z-40 flex flex-col shadow-2xl backdrop-blur-xl`}
    >
      <div className={`p-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'} flex items-center justify-between`}>
        <h3 className="font-bold flex items-center gap-2">
          <ListMusic className="w-5 h-5 text-violet-400" />
          Queue <span className="text-sm font-normal text-gray-400">({queue.length})</span>
        </h3>
        <div className="flex gap-2">
          {queue.length > 0 && (
            <button
              onClick={onClear}
              aria-label="Clear queue"
              className="text-xs px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Close queue"
            className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
            <ListMusic className="w-10 h-10 opacity-30" aria-hidden="true" />
            <p className="text-sm">Queue is empty</p>
            <p className="text-xs">Add songs to queue to see them here</p>
          </div>
        ) : (
          queue.map((song, idx) => (
            <QueueItem
              key={song.videoId}
              song={song}
              idx={idx}
              isActive={currentSong?.videoId === song.videoId}
              darkMode={darkMode}
              onPlay={onPlay}
              onRemove={onRemove}
            />
          ))
        )}
      </div>
    </div>
  );
});
