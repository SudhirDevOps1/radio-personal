import { useState, useCallback } from 'react';
import { Music } from 'lucide-react';

interface Props {
    src: string;
    alt: string;
    isPlaying: boolean;
    size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
};

const DOT_SIZES = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
};

export default function SpinningAlbumArt({ src, alt, isPlaying, size = 'md' }: Props) {
    const [imgError, setImgError] = useState(false);

    const handleImgError = useCallback(() => setImgError(true), []);

    return (
        <div
            className={`${SIZES[size]} relative flex-shrink-0 rounded-full`}
            style={{
                animation: 'spin-cd 8s linear infinite',
                animationPlayState: isPlaying ? 'running' : 'paused',
            }}
        >
            {!imgError ? (
                <img
                    src={src}
                    alt={alt}
                    onError={handleImgError}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="w-full h-full object-cover rounded-full ring-2 ring-violet-500/40 shadow-lg transform-gpu"
                />
            ) : (
                <div
                    role="img"
                    aria-label={alt}
                    className="w-full h-full rounded-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center ring-2 ring-violet-500/40"
                >
                    <Music className="w-1/2 h-1/2 text-white opacity-80" />
                </div>
            )}

            {/* CD center dot - scales with size */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
                <div className={`${DOT_SIZES[size]} bg-white/80 rounded-full shadow-inner border-2 border-black/20`} />
            </div>
        </div>
    );
}
