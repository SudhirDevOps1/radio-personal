import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { Radio, Search, Play, Pause, Volume2, VolumeX, Star, Heart, Wifi, WifiOff } from 'lucide-react';
import type { RadioStation } from '@/types';
import {
    getTopStations, searchStations,
    getStationsByLanguage, getStationsByTag,
    RADIO_CATEGORIES,
} from '@/utils/radioApi';

interface Props {
    darkMode: boolean;
    addToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

// ─── Memoized Station Card ──────────────────────────────────────────────────
const StationCard = memo(function StationCard({
    station, isActive, isPlaying, isFavorite,
    darkMode, onPlay, onToggleFavorite,
}: {
    station: RadioStation;
    isActive: boolean;
    isPlaying: boolean;
    isFavorite: boolean;
    darkMode: boolean;
    onPlay: (s: RadioStation) => void;
    onToggleFavorite: (id: string) => void;
}) {
    const [imgFailed, setImgFailed] = useState(false);

    const handlePlay = useCallback(() => onPlay(station), [onPlay, station]);
    const handleFav = useCallback(() => onToggleFavorite(station.stationuuid), [onToggleFavorite, station.stationuuid]);
    const handleImgError = useCallback(() => setImgFailed(true), []);

    return (
        <div
            className={`flex items-center gap-3 p-3 rounded-xl transition-all group transform-gpu ${isActive
                    ? 'bg-violet-500/20 border border-violet-500/50'
                    : darkMode
                        ? 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-500/30'
                        : 'bg-white/60 hover:bg-white border border-gray-200 hover:border-violet-400/50'
                }`}
        >
            {/* Favicon */}
            <div className="relative w-12 h-12 flex-shrink-0">
                {!imgFailed && station.favicon ? (
                    <img
                        src={station.favicon}
                        alt={station.name}
                        className="w-12 h-12 rounded-xl object-cover"
                        onError={handleImgError}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                    />
                ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center">
                        <Radio className="w-6 h-6 text-white" />
                    </div>
                )}
                {isActive && isPlaying && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow">
                        <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm truncate ${isActive ? 'text-violet-400' : ''}`}>
                    {station.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {station.country && (
                        <span className="text-[10px] text-gray-400">{station.country}</span>
                    )}
                    {station.language && (
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                            {station.language}
                        </span>
                    )}
                    {station.bitrate > 0 && (
                        <span className="text-[10px] text-gray-400">{station.bitrate}kbps</span>
                    )}
                    {station.codec && (
                        <span className="text-[10px] bg-gray-500/20 text-gray-400 px-1.5 py-0.5 rounded">
                            {station.codec}
                        </span>
                    )}
                </div>
                {station.tags && (
                    <p className="text-[10px] text-gray-500 truncate mt-0.5">
                        {station.tags.split(',').slice(0, 3).join(' · ')}
                    </p>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
                <button
                    onClick={handleFav}
                    aria-label={isFavorite ? `Unfavorite ${station.name}` : `Favorite ${station.name}`}
                    className={`p-1.5 rounded-full transition-colors ${isFavorite ? 'text-pink-500' : darkMode ? 'text-white/30 hover:text-white' : 'text-gray-300 hover:text-gray-600'
                        }`}
                >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-pink-500' : ''}`} />
                </button>
                <button
                    onClick={handlePlay}
                    aria-label={isPlaying ? `Pause ${station.name}` : `Play ${station.name}`}
                    className={`p-2 rounded-full transition-all ${isActive && isPlaying
                            ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/40'
                            : 'bg-violet-500/20 hover:bg-violet-500 text-violet-400 hover:text-white'
                        }`}
                >
                    {isActive && isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>
            </div>
        </div>
    );
});

// ─── Main Radio Section ─────────────────────────────────────────────────────
export default function RadioSection({ darkMode, addToast }: Props) {
    const [stations, setStations] = useState<RadioStation[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('top');
    const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(80);
    const [isMuted, setIsMuted] = useState(false);
    const [favorites, setFavorites] = useState<Set<string>>(() => {
        try {
            const parsed = JSON.parse(localStorage.getItem('radioFavorites') || '[]');
            return new Set(Array.isArray(parsed) ? parsed : []);
        } catch { return new Set(); }
    });
    const [showFavorites, setShowFavorites] = useState(false);
    const [streamError, setStreamError] = useState(false);
    const [npImgFailed, setNpImgFailed] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const addToastRef = useRef(addToast);
    const isPlayingRef = useRef(false);
    const streamErrorRef = useRef(false);
    const currentStationRef = useRef<RadioStation | null>(null);

    // Sync refs
    useEffect(() => { addToastRef.current = addToast; }, [addToast]);
    useEffect(() => { currentStationRef.current = currentStation; }, [currentStation]);
    useEffect(() => { setNpImgFailed(false); }, [currentStation]);

    // Initialize audio ONCE
    useEffect(() => {
        const audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audio.preload = 'none';
        audioRef.current = audio;

        audio.addEventListener('playing', () => {
            isPlayingRef.current = true;
            setIsPlaying(true);
            setStreamError(false);
            streamErrorRef.current = false;
        });
        audio.addEventListener('pause', () => {
            isPlayingRef.current = false;
            setIsPlaying(false);
        });
        audio.addEventListener('error', () => {
            streamErrorRef.current = true;
            setStreamError(true);
            isPlayingRef.current = false;
            setIsPlaying(false);
            addToastRef.current('Stream error. Trying next URL...', 'error');
        });
        audio.addEventListener('waiting', () => {
            isPlayingRef.current = false;
            setIsPlaying(false);
        });
        audio.addEventListener('canplay', () => {
            isPlayingRef.current = true;
            setIsPlaying(true);
        });

        return () => {
            audio.pause();
            audio.src = '';
            audioRef.current = null;
        };
    }, []);

    // Volume sync
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume / 100;
        }
    }, [volume, isMuted]);

    const loadCategory = useCallback(async (cat: typeof RADIO_CATEGORIES[0]) => {
        setLoading(true);
        setSearchQuery('');
        try {
            let data: RadioStation[] = [];
            if (cat.type === 'top') data = await getTopStations(60);
            else if (cat.type === 'language') data = await getStationsByLanguage(cat.query, 60);
            else data = await getStationsByTag(cat.query, 60);
            setStations(data);
            if (data.length === 0) addToastRef.current('No stations found for this category', 'info');
        } catch {
            addToastRef.current('Failed to load radio stations', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    // Load top stations on mount
    useEffect(() => {
        loadCategory(RADIO_CATEGORIES[0]);
    }, [loadCategory]);

    const handleCategoryClick = useCallback((cat: typeof RADIO_CATEGORIES[0]) => {
        setActiveCategory(cat.id);
        loadCategory(cat);
    }, [loadCategory]);

    const handleSearch = useCallback(async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!searchQuery.trim()) return;
        setLoading(true);
        setActiveCategory('');
        try {
            const data = await searchStations(searchQuery.trim(), 60);
            setStations(data);
            if (data.length === 0) addToastRef.current('No stations found. Try different keywords.', 'info');
            else addToastRef.current(`Found ${data.length} stations`, 'success');
        } catch {
            addToastRef.current('Radio search failed', 'error');
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    const playStation = useCallback((station: RadioStation) => {
        const audio = audioRef.current;
        if (!audio) return;

        if (currentStationRef.current?.stationuuid === station.stationuuid && !streamErrorRef.current) {
            if (isPlayingRef.current) {
                audio.pause();
            } else {
                audio.play().catch(() => {
                    streamErrorRef.current = true;
                    setStreamError(true);
                });
            }
            return;
        }

        setCurrentStation(station);
        currentStationRef.current = station;
        setStreamError(false);
        streamErrorRef.current = false;
        setIsPlaying(false);
        isPlayingRef.current = false;
        audio.pause();

        const url = station.url_resolved || station.url;
        if (!url) { addToastRef.current('No stream URL available', 'error'); return; }

        audio.src = url;
        audio.load();
        audio.play().catch((e) => {
            console.error('[Radio] play error:', e);
            streamErrorRef.current = true;
            setStreamError(true);
            addToastRef.current('Cannot play this station. Try another.', 'error');
        });

        addToastRef.current(`📻 Playing: ${station.name}`, 'success');

        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: station.name,
                artist: station.country || 'Radio Station',
                album: 'PrivMITLab Radio',
                artwork: station.favicon ? [{ src: station.favicon, sizes: '96x96', type: 'image/png' }] : [],
            });
            navigator.mediaSession.setActionHandler('play', () => audio.play());
            navigator.mediaSession.setActionHandler('pause', () => audio.pause());
        }
    }, []);

    const toggleFavorite = useCallback((id: string) => {
        setFavorites((prev) => {
            const n = new Set(prev);
            if (n.has(id)) {
                n.delete(id);
                addToastRef.current('Removed from favorites', 'info');
            } else {
                n.add(id);
                addToastRef.current('Added to favorites ❤️', 'success');
            }
            localStorage.setItem('radioFavorites', JSON.stringify([...n]));
            return n;
        });
    }, []);

    const displayedStations = useMemo(() => {
        return showFavorites ? stations.filter((s) => favorites.has(s.stationuuid)) : stations;
    }, [stations, showFavorites, favorites]);

    const card = darkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-gray-200';

    return (
        <div className="space-y-4">
            {/* Radio Header */}
            <div className={`${card} border rounded-2xl p-4`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-gradient-to-br from-violet-500 to-pink-500 rounded-xl">
                        <Radio className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">📻 Live Radio</h2>
                        <p className="text-xs text-gray-400">50,000+ stations worldwide • No account needed</p>
                    </div>
                </div>

                {/* Search */}
                <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                    <div className={`flex items-center gap-2 flex-1 px-3 py-2 rounded-xl border ${darkMode ? 'bg-white/5 border-white/15' : 'bg-white border-gray-200'
                        }`}>
                        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search stations by name, country, language..."
                            className="bg-transparent outline-none flex-1 text-sm"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 flex-shrink-0"
                    >
                        Search
                    </button>
                </form>

                {/* Categories */}
                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <button
                        onClick={() => setShowFavorites(!showFavorites)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 border ${showFavorites
                                ? 'bg-pink-500 text-white border-pink-500'
                                : darkMode
                                    ? 'bg-white/8 border-white/15 hover:bg-white/15'
                                    : 'bg-gray-100 border-gray-200 hover:bg-gray-200'
                            }`}
                    >
                        <Heart className={`w-3 h-3 ${showFavorites ? 'fill-white' : ''}`} />
                        Favorites ({favorites.size})
                    </button>
                    {RADIO_CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryClick(cat)}
                            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${activeCategory === cat.id && !showFavorites
                                    ? 'bg-violet-500 text-white border-violet-500'
                                    : darkMode
                                        ? 'bg-white/8 border-white/15 hover:bg-white/15'
                                        : 'bg-gray-100 border-gray-200 hover:bg-gray-200'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Now Playing Radio Bar */}
            {currentStation && (
                <div className={`${card} border rounded-2xl p-4`}>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                                {currentStation.favicon && !npImgFailed ? (
                                    <img
                                        src={currentStation.favicon}
                                        alt={currentStation.name}
                                        className="w-14 h-14 rounded-xl object-cover"
                                        onError={() => setNpImgFailed(true)}
                                        draggable={false}
                                    />
                                ) : (
                                    <Radio className="w-7 h-7 text-white" />
                                )}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${isPlaying ? 'bg-green-500' : 'bg-gray-500'}`}>
                                {isPlaying ? <Wifi className="w-2.5 h-2.5 text-white" /> : <WifiOff className="w-2.5 h-2.5 text-white" />}
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="font-bold truncate">{currentStation.name}</p>
                            <p className="text-xs text-gray-400 truncate">
                                {[currentStation.country, currentStation.language].filter(Boolean).join(' · ')}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                                <span className="text-xs text-gray-400">
                                    {isPlaying ? '🔴 LIVE' : streamError ? '⚠️ Error' : '⏹ Stopped'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                aria-label={isMuted ? 'Unmute' : 'Mute'}
                                className={`p-2 rounded-full ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                            >
                                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                            </button>
                            <input
                                type="range" min={0} max={100} value={isMuted ? 0 : volume}
                                onChange={(e) => { setVolume(Number(e.target.value)); setIsMuted(Number(e.target.value) === 0); }}
                                className="w-20 accent-violet-500 hidden md:block"
                                aria-label="Volume"
                            />

                            <button
                                onClick={() => playStation(currentStation)}
                                className="p-3 bg-gradient-to-r from-violet-500 to-pink-500 rounded-full hover:opacity-90 shadow-lg"
                                aria-label={isPlaying ? 'Pause' : 'Play'}
                            >
                                {isPlaying
                                    ? <Pause className="w-5 h-5 text-white fill-white" />
                                    : <Play className="w-5 h-5 text-white fill-white ml-0.5" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stations List */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className={`h-20 rounded-xl animate-pulse ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`} />
                    ))}
                </div>
            ) : displayedStations.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <Radio className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>{showFavorites ? 'No favorite stations yet' : 'No stations found'}</p>
                    <p className="text-xs mt-1">
                        {showFavorites ? 'Heart stations to add them here' : 'Try a different category or search term'}
                    </p>
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-400">{displayedStations.length} stations</p>
                        {favorites.size > 0 && (
                            <button
                                onClick={() => setShowFavorites(!showFavorites)}
                                className="flex items-center gap-1 text-xs text-pink-400 hover:text-pink-500"
                            >
                                <Star className="w-3 h-3 fill-current" />
                                {showFavorites ? 'Show All' : `Favorites (${favorites.size})`}
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {displayedStations.map((station) => (
                            <StationCard
                                key={station.stationuuid}
                                station={station}
                                isActive={currentStation?.stationuuid === station.stationuuid}
                                isPlaying={currentStation?.stationuuid === station.stationuuid && isPlaying}
                                isFavorite={favorites.has(station.stationuuid)}
                                darkMode={darkMode}
                                onPlay={playStation}
                                onToggleFavorite={toggleFavorite}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
