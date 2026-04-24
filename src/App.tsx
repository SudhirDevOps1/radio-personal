import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    Search, Settings, Music, Moon, Sun, Radio,
    TrendingUp, Clock, Heart, X, Play,
    Wifi, WifiOff,
} from 'lucide-react';

import type { Song, SearchProvider, ActiveTab } from '@/types';
import { searchSongs, clearSearchCache } from '@/utils/api';
import { initYouTubePlayer } from '@/utils/youtubePlayer';
import { usePlayer } from '@/hooks/usePlayer';
import { useQueue } from '@/hooks/useQueue';
import { useOfflineCache } from '@/hooks/useOfflineCache';
import { useToast } from '@/hooks/useToast';
import { ARTISTS, MOODS, TRENDING_SEARCHES } from '@/data/artists';

import ArtistSection from '@/components/ArtistSection';
import SongCard from '@/components/SongCard';
import PlayerBar from '@/components/PlayerBar';
import QueuePanel from '@/components/QueuePanel';
import SettingsModal from '@/components/SettingsModal';
import ToastContainer from '@/components/ToastContainer';
import RadioSection from '@/components/RadioSection';
import Footer from '@/components/Footer';

function safeJSONParse<T>(val: string | null, fallback: T): T {
    if (!val) return fallback;
    try {
        const parsed = JSON.parse(val);
        return parsed ?? fallback;
    } catch {
        return fallback;
    }
}

function safeSetParse(val: string | null): Set<string> {
    const arr = safeJSONParse<unknown[]>(val, []);
    return new Set(Array.isArray(arr) ? arr : []);
}

export default function App() {
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') !== 'false');
    const [provider, setProvider] = useState<SearchProvider>(
        () => (localStorage.getItem('preferredProvider') as SearchProvider) || 'piped',
    );
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('youtubeApiKey') || '');

    const [activeTab, setActiveTab] = useState<ActiveTab>('music');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Song[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showQueue, setShowQueue] = useState(false);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>(() =>
        safeJSONParse<Song[]>(localStorage.getItem('recentlyPlayed'), []),
    );
    const [favorites, setFavorites] = useState<Set<string>>(() =>
        safeSetParse(localStorage.getItem('favorites')),
    );

    const { toasts, addToast, removeToast } = useToast();
    const { queue, addToQueue, removeFromQueue, clearQueue } = useQueue();
    const { cachedSongs, handleClearCache, refreshCache } = useOfflineCache();
    const player = usePlayer(queue);

    const playerRef = useRef(player);
    const queueRef = useRef(queue);
    const addToastRef = useRef(addToast);

    useEffect(() => { playerRef.current = player; }, [player]);
    useEffect(() => { queueRef.current = queue; }, [queue]);
    useEffect(() => { addToastRef.current = addToast; }, [addToast]);

    const cachedVideoIds = useMemo(
        () => new Set(cachedSongs.map((c) => c.videoId)),
        [cachedSongs],
    );

    const favoriteSongs = useMemo(
        () => recentlyPlayed.filter((s) => favorites.has(s.videoId)).slice(0, 5),
        [recentlyPlayed, favorites],
    );

    const stats = useMemo(() => [
        { label: 'Artists', value: `${ARTISTS.length}+`, icon: '🎤' },
        { label: 'Offline Songs', value: String(cachedSongs.length), icon: '💾' },
        { label: 'Favorites', value: String(favorites.size), icon: '❤️' },
        { label: 'Queue', value: String(queue.length), icon: '🎵' },
    ], [cachedSongs.length, favorites.size, queue.length]);

    useEffect(() => {
        const online = () => { setIsOnline(true); addToastRef.current('Back online 🌐', 'success'); };
        const offline = () => { setIsOnline(false); addToastRef.current('You are offline. Cached songs still work!', 'warning'); };
        window.addEventListener('online', online);
        window.addEventListener('offline', offline);
        return () => {
            window.removeEventListener('online', online);
            window.removeEventListener('offline', offline);
        };
    }, []);

    useEffect(() => {
        const timer = setTimeout(async () => {
            try {
                await initYouTubePlayer('yt-player', {
                    onReady: () => {
                        setIsPlayerReady(true);
                        addToastRef.current('Player ready ▶️', 'success');
                    },
                    onError: () => addToastRef.current('Playback error. Try another song.', 'error'),
                });
            } catch (err) {
                console.error('[App] YT init failed:', err);
                addToastRef.current('Player initializing…', 'info');
            }
        }, 400);
        return () => clearTimeout(timer);
    }, []);

    const doSearch = useCallback(async (q: string) => {
        if (!q.trim()) return;
        setIsLoading(true);
        setSearchError(null);
        setSearchResults([]);
        try {
            const result = await searchSongs(q.trim(), apiKey, provider);
            if (result.songs.length === 0) {
                setSearchError(
                    provider === 'youtube' && !apiKey
                        ? 'YouTube provider requires an API key. Switch to Piped or Invidious in Settings.'
                        : `No songs found for "${q}". Try different keywords or switch provider.`,
                );
            } else {
                setSearchResults(result.songs);
                addToastRef.current(`Found ${result.songs.length} songs via ${result.provider}`, 'success');
            }
        } catch (err) {
            console.error('[App] Search error:', err);
            setSearchError('Search failed. Check your internet connection or try a different provider.');
        } finally {
            setIsLoading(false);
        }
    }, [apiKey, provider]);

    const handleSearch = useCallback((e?: React.FormEvent) => {
        e?.preventDefault();
        doSearch(searchQuery);
    }, [doSearch, searchQuery]);

    const handleClearSearch = useCallback(() => {
        setSearchQuery('');
        setSearchResults([]);
        setSearchError(null);
    }, []);

    const addToRecentlyPlayed = useCallback((song: Song) => {
        setRecentlyPlayed((prev) => {
            const filtered = prev.filter((s) => s.videoId !== song.videoId);
            const updated = [song, ...filtered].slice(0, 20);
            localStorage.setItem('recentlyPlayed', JSON.stringify(updated));
            return updated;
        });
    }, []);

    const handlePlaySong = useCallback((song: Song) => {
        addToRecentlyPlayed(song);
        const currentQueue = queueRef.current;
        let newQueue = currentQueue;
        if (!currentQueue.some((s) => s.videoId === song.videoId)) {
            newQueue = [...currentQueue, song];
            addToQueue(song);
        }
        player.playSong(song, newQueue);
        addToastRef.current(`▶ ${song.title}`, 'success');
    }, [addToRecentlyPlayed, addToQueue, player]);

    const handleAddToQueue = useCallback((song: Song) => {
        if (!queueRef.current.some((s) => s.videoId === song.videoId)) {
            addToQueue(song);
            addToastRef.current(`Added to queue: ${song.title}`, 'info');
        } else {
            addToastRef.current('Song already in queue', 'info');
        }
    }, [addToQueue]);

    const toggleFavorite = useCallback((song: Song) => {
        setFavorites((prev) => {
            const n = new Set(prev);
            if (n.has(song.videoId)) {
                n.delete(song.videoId);
                addToastRef.current('Removed from favorites', 'info');
            } else {
                n.add(song.videoId);
                addToastRef.current('Added to favorites ❤️', 'success');
            }
            localStorage.setItem('favorites', JSON.stringify([...n]));
            return n;
        });
    }, []);

    const handleToggleFavoriteCurrent = useCallback(() => {
        const song = playerRef.current.currentSong;
        if (song) toggleFavorite(song);
    }, [toggleFavorite]);

    const handleToggleDarkMode = useCallback(() => {
        setDarkMode((d) => { localStorage.setItem('darkMode', String(!d)); return !d; });
    }, []);

    const handleSaveProvider = useCallback((p: SearchProvider) => {
        setProvider(p);
        localStorage.setItem('preferredProvider', p);
        addToastRef.current(`Switched to ${p}`, 'info');
    }, []);

    const handleSaveApiKey = useCallback((k: string) => {
        setApiKey(k);
        localStorage.setItem('youtubeApiKey', k);
        addToastRef.current(k ? 'API key saved ✓' : 'API key cleared', 'success');
        setShowSettings(false);
    }, []);

    const handleClearOfflineCache = useCallback(async () => {
        await handleClearCache();
        refreshCache();
        addToastRef.current('Offline cache cleared', 'success');
    }, [handleClearCache, refreshCache]);

    const handleClearSearchCache = useCallback(() => {
        clearSearchCache();
        addToastRef.current('Search cache cleared', 'success');
    }, []);

    const handleToggleQueue = useCallback(() => setShowQueue((q) => !q), []);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement).tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;
            const p = playerRef.current;
            switch (e.code) {
                case 'Space': case 'KeyK': e.preventDefault(); p.togglePlay(); break;
                case 'KeyN': p.next(); break;
                case 'KeyP': p.previous(); break;
                case 'KeyM': p.toggleMute(); break;
                case 'KeyS': p.toggleShuffle(); break;
                case 'KeyR': {
                    const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all'];
                    const i = modes.indexOf(p.playerState.repeatMode);
                    p.setRepeatMode(modes[(i + 1) % 3]);
                    break;
                }
                case 'ArrowUp': e.preventDefault(); p.setVolume(Math.min(100, p.playerState.volume + 10)); break;
                case 'ArrowDown': e.preventDefault(); p.setVolume(Math.max(0, p.playerState.volume - 10)); break;
                case 'ArrowRight': if (e.shiftKey) { e.preventDefault(); p.seekForward(); } break;
                case 'ArrowLeft': if (e.shiftKey) { e.preventDefault(); p.seekBackward(); } break;
                case 'KeyF': {
                    const song = p.currentSong;
                    if (song) toggleFavorite(song);
                    break;
                }
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [toggleFavorite]);

    const bg = darkMode
        ? 'bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white'
        : 'bg-gradient-to-br from-gray-50 via-purple-50 to-gray-100 text-gray-900';

    const glass = darkMode
        ? 'bg-white/5 backdrop-blur-xl border-white/10'
        : 'bg-white/70 backdrop-blur-xl border-gray-200/80';

    const headerGlass = darkMode
        ? 'bg-slate-900/80 backdrop-blur-xl border-white/10'
        : 'bg-white/80 backdrop-blur-xl border-gray-200/80';

    const currentVideoId = player.currentSong?.videoId;

    return (
        <div className={`min-h-screen ${bg} transition-colors duration-300`}>
            <div
                id="yt-player"
                aria-hidden="true"
                style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '1px', height: '1px', pointerEvents: 'none' }}
            />

            <header className={`sticky top-0 z-50 ${headerGlass} border-b shadow-sm`}>
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="p-2 bg-gradient-to-br from-violet-500 to-pink-500 rounded-xl shadow-lg">
                            <Music className="w-5 h-5 text-white" />
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-lg font-extrabold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent leading-tight">
                                PrivMITLab
                            </h1>
                            <p className="text-[10px] text-gray-400 leading-none">Music & Radio Hub</p>
                        </div>
                    </div>

                    <div className={`flex gap-1 p-1 rounded-xl ${darkMode ? 'bg-white/8' : 'bg-gray-100'}`}>
                        {(['music', 'radio'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab
                                    ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-md'
                                    : darkMode ? 'text-white/60 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab === 'music' ? <Music className="w-4 h-4" /> : <Radio className="w-4 h-4" />}
                                {tab === 'music' ? 'Music' : 'Radio'}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        <div className={`hidden md:flex items-center gap-1 text-xs px-2 py-1 rounded-full ${isOnline ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                            <span>{isOnline ? 'Online' : 'Offline'}</span>
                        </div>
                        <div className={`hidden md:flex items-center gap-1 text-xs px-2 py-1 rounded-full ${isPlayerReady ? 'bg-violet-500/15 text-violet-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${isPlayerReady ? 'bg-violet-400' : 'bg-yellow-400 animate-pulse'}`} />
                            <span>{isPlayerReady ? 'Ready' : 'Loading'}</span>
                        </div>
                        <button onClick={handleToggleDarkMode} className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-200'}`} aria-label="Toggle theme">
                            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                        <button onClick={() => setShowSettings(true)} className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-200'}`} aria-label="Settings">
                            <Settings className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>

            <main className={`max-w-7xl mx-auto px-4 py-6 ${player.currentSong ? 'pb-52' : 'pb-8'}`}>
                {activeTab === 'music' && (
                    <div className="space-y-6">
                        <form onSubmit={handleSearch}>
                            <div className={`flex gap-2 p-2 rounded-2xl ${glass} border shadow-lg`}>
                                <Search className="w-5 h-5 ml-2 text-violet-400 self-center flex-shrink-0" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search songs, artists, albums..."
                                    className={`flex-1 bg-transparent outline-none px-2 py-2 text-sm ${darkMode ? 'placeholder-white/30' : 'placeholder-gray-400'}`}
                                />
                                {searchQuery && (
                                    <button type="button" onClick={handleClearSearch} className="p-2 hover:text-red-400 transition-colors" aria-label="Clear search">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={isLoading || !searchQuery.trim()}
                                    className="px-5 py-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-all shadow-md flex-shrink-0"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4A8 8 0 004 12z" />
                                            </svg>
                                            Searching
                                        </span>
                                    ) : 'Search'}
                                </button>
                            </div>
                            <div className="flex items-center justify-between mt-1.5 px-1">
                                <span className="text-[11px] text-gray-400">
                                    Provider: <span className="text-violet-400 font-medium capitalize">{provider}</span>
                                </span>
                                <span className="text-[11px] text-gray-400 hidden sm:block">
                                    Press <kbd className="bg-violet-500/20 text-violet-400 px-1 rounded text-[10px] font-mono">Space</kbd> to play/pause anywhere
                                </span>
                            </div>
                        </form>

                        {searchError && (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400" role="alert">
                                <p className="font-medium text-sm">⚠️ {searchError}</p>
                                <div className="flex gap-2 mt-2">
                                    <button onClick={() => doSearch(searchQuery)} className="text-xs px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg">Retry</button>
                                    <button onClick={() => setShowSettings(true)} className="text-xs px-3 py-1.5 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 rounded-lg">Switch Provider</button>
                                </div>
                            </div>
                        )}

                        {searchResults.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-base font-bold flex items-center gap-2">
                                        🔍 Results <span className="text-sm font-normal text-gray-400">({searchResults.length})</span>
                                    </h2>
                                    <button onClick={handleClearSearch} className={`text-xs px-3 py-1.5 rounded-lg ${darkMode ? 'bg-white/8 hover:bg-white/15' : 'bg-gray-100 hover:bg-gray-200'}`}>Clear</button>
                                </div>
                                <div className="space-y-2">
                                    {searchResults.map((song) => (
                                        <SongCard key={song.videoId} song={song} isPlaying={player.isPlaying} isCurrent={currentVideoId === song.videoId} isFavorite={favorites.has(song.videoId)} isCached={cachedVideoIds.has(song.videoId)} onPlay={handlePlaySong} onAddToQueue={handleAddToQueue} onToggleFavorite={toggleFavorite} darkMode={darkMode} />
                                    ))}
                                </div>
                            </section>
                        )}

                        <section>
                            <h2 className="text-base font-bold mb-3 flex items-center gap-2">🎭 Browse by Mood</h2>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {MOODS.map((mood) => (
                                    <button key={mood.id} onClick={() => { setSearchQuery(mood.name); doSearch(mood.query); }} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 active:scale-95 border ${darkMode ? 'bg-white/8 border-white/15 hover:bg-violet-500/30 hover:border-violet-500/50' : 'bg-white/70 border-gray-200 hover:bg-violet-50 hover:border-violet-400'}`}>
                                        {mood.name}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <ArtistSection onArtistClick={(q) => { setSearchQuery(q); doSearch(q); }} darkMode={darkMode} />

                        <section>
                            <h2 className="text-base font-bold mb-3 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-violet-400" />
                                🔥 Trending Searches
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {TRENDING_SEARCHES.map((term) => (
                                    <button key={term} onClick={() => { setSearchQuery(term); doSearch(term); }} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105 active:scale-95 border ${darkMode ? 'bg-white/8 border-white/15 hover:bg-violet-500/20 hover:border-violet-500/40' : 'bg-white/70 border-gray-200 hover:bg-violet-50 hover:border-violet-400'}`}>
                                        {term}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {recentlyPlayed.length > 0 && (
                            <section>
                                <h2 className="text-base font-bold mb-3 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-violet-400" />
                                    ⏱️ Recently Played
                                </h2>
                                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                    {recentlyPlayed.slice(0, 12).map((song) => (
                                        <button key={song.videoId} onClick={() => handlePlaySong(song)} className={`flex-shrink-0 w-40 p-3 rounded-2xl border text-left transition-all hover:scale-105 active:scale-95 group ${currentVideoId === song.videoId ? 'bg-violet-500/20 border-violet-500/40' : darkMode ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-violet-500/30' : 'bg-white/60 border-gray-200 hover:bg-white hover:border-violet-400/50'}`}>
                                            <div className="relative mb-2">
                                                <img src={song.thumbnail} alt={song.title} className="w-full h-24 rounded-xl object-cover" loading="lazy" decoding="async" draggable={false} />
                                                <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Play className="w-8 h-8 text-white fill-white" />
                                                </div>
                                            </div>
                                            <p className="text-xs font-semibold truncate leading-tight">{song.title}</p>
                                            <p className={`text-[10px] truncate mt-0.5 ${darkMode ? 'text-white/40' : 'text-gray-400'}`}>{song.artist}</p>
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}

                        {favoriteSongs.length > 0 && (
                            <section>
                                <h2 className="text-base font-bold mb-3 flex items-center gap-2">
                                    <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
                                    ❤️ Your Favorites
                                </h2>
                                <div className="space-y-2">
                                    {favoriteSongs.map((song) => (
                                        <SongCard key={song.videoId} song={song} isPlaying={player.isPlaying} isCurrent={currentVideoId === song.videoId} isFavorite={true} isCached={cachedVideoIds.has(song.videoId)} onPlay={handlePlaySong} onAddToQueue={handleAddToQueue} onToggleFavorite={toggleFavorite} darkMode={darkMode} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {cachedSongs.length > 0 && (
                            <section>
                                <h2 className="text-base font-bold mb-3 flex items-center gap-2">
                                    💾 Offline Songs
                                    <span className="text-sm font-normal text-gray-400">({cachedSongs.length})</span>
                                </h2>
                                <div className="space-y-2">
                                    {cachedSongs.slice(0, 8).map((song) => (
                                        <SongCard key={song.videoId} song={song} isPlaying={player.isPlaying} isCurrent={currentVideoId === song.videoId} isFavorite={favorites.has(song.videoId)} isCached={true} onPlay={handlePlaySong} onAddToQueue={handleAddToQueue} onToggleFavorite={toggleFavorite} darkMode={darkMode} />
                                    ))}
                                </div>
                            </section>
                        )}

                        <section>
                            <h2 className="text-base font-bold mb-1 flex items-center gap-2 text-gray-400 text-sm">ℹ️ App Info</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {stats.map((stat) => (
                                    <div key={stat.label} className={`p-3 rounded-xl border text-center ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-gray-200'}`}>
                                        <p className="text-xl">{stat.icon}</p>
                                        <p className="text-lg font-bold text-violet-400">{stat.value}</p>
                                        <p className="text-xs text-gray-400">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'radio' && (
                    <RadioSection darkMode={darkMode} addToast={addToast} />
                )}

                <Footer darkMode={darkMode} />
            </main>

            <PlayerBar
                currentSong={player.currentSong}
                isPlaying={player.isPlaying}
                playerState={player.playerState}
                isFavorite={player.currentSong ? favorites.has(player.currentSong.videoId) : false}
                showQueue={showQueue}
                darkMode={darkMode}
                onTogglePlay={player.togglePlay}
                onNext={player.next}
                onPrevious={player.previous}
                onSeek={player.seek}
                onSetVolume={player.setVolume}
                onToggleMute={player.toggleMute}
                onToggleShuffle={player.toggleShuffle}
                onSetRepeatMode={player.setRepeatMode}
                onToggleFavorite={handleToggleFavoriteCurrent}
                onToggleQueue={handleToggleQueue}
            />

            {showQueue && (
                <QueuePanel queue={queue} currentSong={player.currentSong} darkMode={darkMode} onPlay={handlePlaySong} onRemove={removeFromQueue} onClear={clearQueue} onClose={() => setShowQueue(false)} />
            )}

            {showSettings && (
                <SettingsModal darkMode={darkMode} provider={provider} apiKey={apiKey} onClose={() => setShowSettings(false)} onToggleDarkMode={handleToggleDarkMode} onSaveProvider={handleSaveProvider} onSaveApiKey={handleSaveApiKey} onClearOfflineCache={handleClearOfflineCache} onClearSearchCache={handleClearSearchCache} />
            )}

            <ToastContainer toasts={toasts} onRemove={removeToast} />

            <div className={`fixed bottom-0 left-4 z-30 text-[10px] px-2 py-1 rounded-t-lg ${isOnline ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'} ${player.currentSong ? 'bottom-28 md:bottom-32' : 'bottom-0'}`} aria-hidden="true">
                {isOnline ? '🌐 Online' : '📴 Offline Mode'}
            </div>
        </div>
    );
}
