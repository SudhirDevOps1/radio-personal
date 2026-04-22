import { Play, X, ListMusic } from 'lucide-react';
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

export default function QueuePanel({ queue, currentSong, darkMode, onPlay, onRemove, onClear, onClose }: Props) {
  const card = darkMode
    ? 'bg-slate-900/98 border-white/10'
    : 'bg-white/98 border-gray-200';

  return (
    <div
      className={`fixed right-0 top-16 bottom-20 md:bottom-28 w-full md:w-80 ${card} border-l z-40 flex flex-col shadow-2xl`}
      style={{ backdropFilter: 'blur(20px)' }}
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
              className="text-xs px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg"
            >
              Clear
            </button>
          )}
          <button onClick={onClose} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
            <ListMusic className="w-10 h-10 opacity-30" />
            <p className="text-sm">Queue is empty</p>
            <p className="text-xs">Add songs to queue to see them here</p>
          </div>
        ) : (
          queue.map((song, idx) => (
            <div
              key={`${song.videoId}-${idx}`}
              className={`flex items-center gap-2 p-2 rounded-xl transition-all group ${
                currentSong?.videoId === song.videoId
                  ? 'bg-violet-500/20 border border-violet-500/40'
                  : darkMode
                  ? 'hover:bg-white/5'
                  : 'hover:bg-gray-50'
              }`}
            >
              <span className="text-xs w-5 text-center text-gray-400 flex-shrink-0">{idx + 1}</span>
              <img
                src={song.thumbnail}
                alt={song.title}
                className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${song.videoId}/default.jpg`; }}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${currentSong?.videoId === song.videoId ? 'text-violet-400' : ''}`}>
                  {song.title}
                </p>
                <p className="text-[10px] text-gray-400 truncate">{song.artist}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onPlay(song)}
                  className="p-1 hover:text-violet-400 transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                </button>
                <button
                  onClick={() => onRemove(idx)}
                  className="p-1 hover:text-red-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
