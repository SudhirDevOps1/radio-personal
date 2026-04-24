import { useCallback, useMemo, useRef, useEffect, memo } from 'react';
import {
    Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
    Shuffle, Repeat, ListMusic, Heart,
} from 'lucide-react';
import type { Song, PlayerState } from '@/types';
import SpinningAlbumArt from './SpinningAlbumArt';
import WaveformVisualizer from './WaveformVisualizer';

interface Props {
    currentSong: Song | null;
    isPlaying: boolean;
    playerState: PlayerState;
    isFavorite: boolean;
    showQueue: boolean;
    darkMode: boolean;
    onTogglePlay: () => void;
    onNext: () => void;
    onPrevious: () => void;
    onSeek: (s: number) => void;
    onSetVolume: (v: number) => void;
    onToggleMute: () => void;
    onToggleShuffle: () => void;
    onSetRepeatMode: (m: 'none' | 'one' | 'all') => void;
    onToggleFavorite: () => void;
    onToggleQueue: () => void;
}

const REPEAT_MODES: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all'];

function formatTime(s: number): string {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

export default memo(function PlayerBar({
    currentSong, isPlaying, playerState,
    isFavorite, showQueue, darkMode,
    onTogglePlay, onNext, onPrevious, onSeek,
    onSetVolume, onToggleMute, onToggleShuffle,
    onSetRepeatMode, onToggleFavorite, onToggleQueue,
}: Props) {
    const seekBarRef = useRef<HTMLDivElement>(null);
    const durationRef = useRef(playerState.duration);

    // Keep duration in sync for drag operations
    useEffect(() => { durationRef.current = playerState.duration; }, [playerState.duration]);

    // ─── Seek Drag Support ───────────────────────────────────────────────────
    const handleSeekInteraction = useCallback((clientX: number, target: HTMLElement) => {
        const rect = target.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        onSeek(pct * durationRef.current);
    }, [onSeek]);

    const handleSeekMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        handleSeekInteraction(e.clientX, target);

        const handleMouseMove = (moveEvent: MouseEvent) => {
            moveEvent.preventDefault();
            handleSeekInteraction(moveEvent.clientX, target);
        };

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [handleSeekInteraction]);

    const handleSeekKeyDown = useCallback((e: React.KeyboardEvent) => {
        const step = e.shiftKey ? 30 : 5;
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            onSeek(Math.min(durationRef.current, playerState.currentTime + step));
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            onSeek(Math.max(0, playerState.currentTime - step));
        }
    }, [onSeek, playerState.currentTime]);

    // ─── Memoized values ─────────────────────────────────────────────────────
    const nextRepeat = useCallback(() => {
        const i = REPEAT_MODES.indexOf(playerState.repeatMode);
        onSetRepeatMode(REPEAT_MODES[(i + 1) % 3]);
    }, [playerState.repeatMode, onSetRepeatMode]);

    const progress = playerState.duration
        ? (playerState.currentTime / playerState.duration) * 100
        : 0;

    const cardClass = darkMode
        ? 'bg-slate-900/95 backdrop-blur-xl border-white/10'
        : 'bg-white/95 backdrop-blur-xl border-gray-200';

    // ─── Early return AFTER all hooks ────────────────────────────────────────
    if (!currentSong) return null;

    return (
        <div className={`fixed bottom-0 left-0 right-0 ${cardClass} border-t z-50 shadow-2xl`} role="region" aria-label="Music Player">
            {/* Waveform */}
            <div className="px-4 pt-1">
                <WaveformVisualizer isPlaying={isPlaying} darkMode={darkMode} />
            </div>

            {/* Seek bar */}
            <div
                ref={seekBarRef}
                role="slider"
                aria-label="Seek"
                aria-valuemin={0}
                aria-valuemax={playerState.duration || 0}
                aria-valuenow={Math.floor(playerState.currentTime)}
                aria-valuetext={`${formatTime(playerState.currentTime)} of ${formatTime(playerState.duration)}`}
                tabIndex={0}
                onKeyDown={handleSeekKeyDown}
                onMouseDown={handleSeekMouseDown}
                className={`w-full h-1.5 cursor-pointer group ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`}
            >
                <div
                    className="h-full bg-gradient-to-r from-violet-500 to-pink-500 relative"
                    style={{ width: `${progress}%` }}
                >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-3 md:px-6 py-2 md:py-3">
                <div className="flex items-center gap-2 md:gap-4">
                    {/* Song Info */}
                    <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                        <SpinningAlbumArt
                            src={currentSong.thumbnail}
                            alt={currentSong.title}
                            isPlaying={isPlaying}
                            size="sm"
                        />
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold text-xs md:text-sm truncate leading-tight">{currentSong.title}</p>
                            <p className={`text-[10px] md:text-xs truncate ${darkMode ? 'text-white/50' : 'text-gray-500'}`}>
                                {currentSong.artist}
                            </p>
                        </div>
                        <button
                            onClick={onToggleFavorite}
                            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            className={`p-1.5 md:p-2 rounded-full flex-shrink-0 transition-colors ${isFavorite ? 'text-pink-500' : darkMode ? 'text-white/40 hover:text-white' : 'text-gray-400 hover:text-gray-700'
                                }`}
                        >
                            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-pink-500' : ''}`} />
                        </button>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                        <button
                            onClick={onToggleShuffle}
                            aria-label={`Shuffle ${playerState.isShuffle ? 'on' : 'off'}`}
                            className={`p-1.5 rounded-lg transition-colors hidden md:flex ${playerState.isShuffle
                                    ? 'text-violet-400 bg-violet-500/20'
                                    : darkMode ? 'text-white/50 hover:text-white' : 'text-gray-400 hover:text-gray-700'
                                }`}
                            title="Shuffle (S)"
                        >
                            <Shuffle className="w-4 h-4" />
                        </button>

                        <button
                            onClick={onPrevious}
                            aria-label="Previous track"
                            className={`p-1.5 md:p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-white/10 text-white/80' : 'hover:bg-gray-100 text-gray-700'
                                }`}
                            title="Previous (P)"
                        >
                            <SkipBack className="w-5 h-5" />
                        </button>

                        <button
                            onClick={onTogglePlay}
                            aria-label={isPlaying ? 'Pause' : 'Play'}
                            className="p-2.5 md:p-3 bg-gradient-to-r from-violet-500 to-pink-500 rounded-full hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-violet-500/30 transform-gpu"
                            title="Play/Pause (Space)"
                        >
                            {isPlaying
                                ? <Pause className="w-5 h-5 md:w-6 md:h-6 text-white fill-white" />
                                : <Play className="w-5 h-5 md:w-6 md:h-6 text-white fill-white ml-0.5" />}
                        </button>

                        <button
                            onClick={onNext}
                            aria-label="Next track"
                            className={`p-1.5 md:p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-white/10 text-white/80' : 'hover:bg-gray-100 text-gray-700'
                                }`}
                            title="Next (N)"
                        >
                            <SkipForward className="w-5 h-5" />
                        </button>

                        <button
                            onClick={nextRepeat}
                            aria-label={`Repeat mode: ${playerState.repeatMode}`}
                            className={`p-1.5 rounded-lg relative transition-colors hidden md:flex ${playerState.repeatMode !== 'none'
                                    ? 'text-violet-400 bg-violet-500/20'
                                    : darkMode ? 'text-white/50 hover:text-white' : 'text-gray-400 hover:text-gray-700'
                                }`}
                            title="Repeat (R)"
                        >
                            <Repeat className="w-4 h-4" />
                            {playerState.repeatMode === 'one' && (
                                <span className="absolute -top-0.5 -right-0.5 text-[8px] font-bold bg-violet-500 text-white w-3.5 h-3.5 flex items-center justify-center rounded-full">
                                    1
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Volume + Time + Queue */}
                    <div className="flex items-center gap-1 md:gap-3 flex-1 justify-end min-w-0">
                        <div className="hidden md:flex items-center gap-1 text-xs text-gray-400 flex-shrink-0" aria-live="off">
                            <span>{formatTime(playerState.currentTime)}</span>
                            <span>/</span>
                            <span>{formatTime(playerState.duration)}</span>
                        </div>

                        <div className="hidden md:flex items-center gap-1.5">
                            <button
                                onClick={onToggleMute}
                                aria-label={playerState.isMuted ? 'Unmute' : 'Mute'}
                                className={`p-1.5 rounded-full ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                                title="Mute (M)"
                            >
                                {playerState.isMuted
                                    ? <VolumeX className="w-4 h-4 text-red-400" />
                                    : <Volume2 className="w-4 h-4" />}
                            </button>
                            <input
                                type="range"
                                min={0}
                                max={100}
                                value={playerState.isMuted ? 0 : playerState.volume}
                                onChange={(e) => onSetVolume(Number(e.target.value))}
                                aria-label="Volume"
                                className="w-20 accent-violet-500 cursor-pointer"
                            />
                        </div>

                        <button
                            onClick={onToggleQueue}
                            aria-label={showQueue ? 'Hide queue' : 'Show queue'}
                            className={`p-1.5 md:p-2 rounded-lg transition-colors ${showQueue
                                    ? 'bg-violet-500 text-white'
                                    : darkMode ? 'hover:bg-white/10 text-white/70' : 'hover:bg-gray-100 text-gray-600'
                                }`}
                            title="Queue"
                        >
                            <ListMusic className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});
