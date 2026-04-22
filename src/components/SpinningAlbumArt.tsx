import { useState } from 'react';
import { Music } from 'lucide-react';

interface Props {
  src: string;
  alt: string;
  isPlaying: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function SpinningAlbumArt({ src, alt, isPlaying, size = 'md' }: Props) {
  const [imgError, setImgError] = useState(false);

  const sizes = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  return (
    <div
      className={`${sizes[size]} relative flex-shrink-0`}
      style={{
        animation: isPlaying ? 'spin-cd 8s linear infinite' : 'none',
        borderRadius: '50%',
      }}
    >
      {!imgError ? (
        <img
          src={src}
          alt={alt}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover rounded-full ring-2 ring-violet-500/40 shadow-lg"
          style={{ borderRadius: '50%' }}
        />
      ) : (
        <div className="w-full h-full rounded-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center ring-2 ring-violet-500/40">
          <Music className="w-1/2 h-1/2 text-white opacity-80" />
        </div>
      )}
      {/* CD center dot */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-3 h-3 bg-white/80 rounded-full shadow-inner" style={{ border: '2px solid rgba(0,0,0,0.2)' }} />
      </div>
    </div>
  );
}
