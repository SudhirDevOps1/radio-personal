import { memo, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Music } from 'lucide-react';
import type { Artist } from '@/types';
import { ARTISTS } from '@/data/artists';
import { resolveArtistImages, generateAvatarDataUri } from '@/utils/artistImages';

// ─── Genre Filter ─────────────────────────────────────────
const GENRE_LABELS = ['All', 'Bollywood', 'Punjabi', 'Bhojpuri', 'Classic', 'Hip-Hop', 'Composer'];

// ─── Single Artist Card ───────────────────────────────────
const ArtistCard = memo(function ArtistCard({
  artist,
  resolvedSrc,
  onArtistClick,
  query,
  darkMode,
}: {
  artist: Artist;
  resolvedSrc: string;
  onArtistClick: (q: string) => void;
  query: string;
  darkMode: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleClick = useCallback(() => onArtistClick(query), [onArtistClick, query]);
  const handleError = useCallback(() => {
    setImgFailed(true);
  }, []);
  const handleLoad = useCallback(() => {
    setImgLoaded(true);
  }, []);

  const fallbackAvatar = useMemo(() => generateAvatarDataUri(artist.name), [artist.name]);

  // Priority: resolved Deezer > original URL > SVG avatar
  const src = imgFailed
    ? fallbackAvatar
    : resolvedSrc || artist.image || fallbackAvatar;

  const isRealPhoto = src !== fallbackAvatar;

  return (
    <button
      onClick={handleClick}
      aria-label={`Play ${artist.name} music`}
      className={`flex flex-col items-center gap-1.5 p-2.5 sm:p-3 rounded-2xl transition-all duration-200
        hover:scale-105 active:scale-95 transform-gpu focus:outline-none focus:ring-2 focus:ring-violet-500
        ${darkMode
          ? 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-500/40'
          : 'bg-white/70 hover:bg-white border border-gray-200 hover:border-violet-400'
        }`}
    >
      {/* Avatar */}
      <div className="relative w-20 h-20 sm:w-24 sm:h-24">
        {/* Shimmer while real photo loads */}
        {isRealPhoto && !imgLoaded && !imgFailed && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-600 animate-pulse z-0" />
        )}

        <img
          src={src}
          alt={artist.name}
          className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-2 ring-violet-400/30 shadow-lg
            transition-opacity duration-300 z-10 relative
            ${imgLoaded || !isRealPhoto ? 'opacity-100' : 'opacity-0'}`}
          onError={handleError}
          onLoad={handleLoad}
          /* NO loading="lazy" — causes images to never load in horizontal scroll */
          decoding="async"
          draggable={false}
        />

        {/* Music badge */}
        <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center shadow-md ring-2 ring-background z-20">
          <Music className="w-3 h-3 text-white" />
        </div>
      </div>

      {/* Name + Genre */}
      <div className="text-center w-full max-w-[96px]">
        <p className="text-[11px] sm:text-xs font-semibold leading-tight truncate">
          {artist.name}
        </p>
        {artist.genre && (
          <p className="text-[9px] sm:text-[10px] text-violet-400 mt-0.5 truncate">
            {artist.genre}
          </p>
        )}
      </div>
    </button>
  );
});

// ─── Main Section ─────────────────────────────────────────
interface Props {
  onArtistClick: (query: string) => void;
  darkMode: boolean;
}

export default memo(function ArtistSection({ onArtistClick, darkMode }: Props) {
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [resolvedImages, setResolvedImages] = useState<Record<string, string>>({});
  const [isResolving, setIsResolving] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    resolveArtistImages(ARTISTS, (progress) => {
      setResolvedImages({ ...progress });
    })
      .then((final) => {
        setResolvedImages(final);
        setIsResolving(false);
      })
      .catch(() => {
        setIsResolving(false);
      });
  }, []);

  const filteredArtists = useMemo(() => {
    if (selectedGenre === 'All') return ARTISTS;
    return ARTISTS.filter((a) => a.genre === selectedGenre);
  }, [selectedGenre]);

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm sm:text-base font-bold flex items-center gap-2">
          🎤 Popular Artists
          <span className="text-xs font-normal text-gray-400">
            ({filteredArtists.length})
          </span>
          {isResolving && (
            <span className="text-[10px] text-violet-400 animate-pulse">loading photos…</span>
          )}
        </h2>
      </div>

      {/* Genre filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-hide">
        {GENRE_LABELS.map((genre) => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(genre)}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all border ${
              selectedGenre === genre
                ? 'bg-violet-500/30 border-violet-500/50 text-violet-300'
                : darkMode
                ? 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>

      {/* Artist grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {filteredArtists.map((artist) => (
          <ArtistCard
            key={artist.id}
            artist={artist}
            resolvedSrc={resolvedImages[artist.id] || ''}
            onArtistClick={onArtistClick}
            query={artist.searchQuery || `${artist.name} songs`}
            darkMode={darkMode}
          />
        ))}
      </div>
    </section>
  );
});
