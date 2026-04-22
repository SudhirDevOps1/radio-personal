// ─── Song ───────────────────────────────────────────────────────────────────

/** A unique video identifier (e.g., YouTube video ID) */
export type VideoId = string & { readonly __brand: 'VideoId' };

/** Formats a duration as "M:SS" or "H:MM:SS" */
export type DurationString = string & { readonly __brand: 'DurationString' };

/** A song from any supported provider (Piped, Invidious, YouTube) */
export interface Song {
  /** Unique video identifier */
  videoId: string;
  /** Cleaned song title (HTML entities decoded) */
  title: string;
  /** Cleaned artist/channel name */
  artist: string;
  /** Thumbnail URL (preferably 320x180 or larger) */
  thumbnail: string;
  /** Human-readable duration string (e.g., "3:45", "1:02:30") */
  duration: string;
  /** Duration in seconds (0 if unknown) */
  durationSeconds: number;
}

/** A song with offline cache data */
export interface CachedSong extends Song {
  /** Raw audio binary data for offline playback */
  blob?: Blob;
  /** Object URL created from blob (must be revoked on cleanup) */
  blobUrl?: string;
  /** Unix timestamp (ms) when this song was cached */
  cachedAt: number;
}

// ─── Toast ──────────────────────────────────────────────────────────────────

/** Toast notification severity level */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

/** A transient notification message */
export interface Toast {
  /** Unique identifier (format: "toast_N") */
  id: string;
  /** Message to display (keep under 100 chars for best UX) */
  message: string;
  /** Visual style / severity */
  type: ToastType;
}

// ─── Artist ─────────────────────────────────────────────────────────────────

/** A curated artist entry for the browse section */
export interface Artist {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Primary genre label (e.g., "Bollywood", "Punjabi") */
  genre: string;
  /** Profile/image URL (Spotify CDN, Wikipedia, or YouTube) */
  image: string;
  /** Custom search query override (defaults to "{name} songs") */
  searchQuery?: string;
}

// ─── Mood ───────────────────────────────────────────────────────────────────

/** A mood/genre preset for quick discovery */
export interface Mood {
  /** Unique identifier */
  id: string;
  /** Display name with emoji (e.g., "😍 Romantic") */
  name: string;
  /** Search query sent to the search API */
  query: string;
  /** Emoji icon used in the UI */
  icon: string;
  /** Tailwind gradient classes (e.g., "from-pink-500 to-rose-500") */
  gradient: string;
}

// ─── Radio ──────────────────────────────────────────────────────────────────

/** A radio station from Radio Browser API */
export interface RadioStation {
  /** Station UUID from Radio Browser */
  stationuuid: string;
  /** Station display name */
  name: string;
  /** Original stream URL */
  url: string;
  /** Resolved/working stream URL (prefer this over url) */
  url_resolved: string;
  /** Station logo/favicon URL */
  favicon: string;
  /** Comma-separated tags (e.g., "bollywood,hindi,pop") */
  tags: string;
  /** Country name (e.g., "India") */
  country: string;
  /** Primary language (e.g., "hindi") */
  language: string;
  /** Stream bitrate in kbps (0 if unknown) */
  bitrate: number;
  /** Audio codec (e.g., "MP3", "AAC", "OGG") */
  codec: string;
  /** Community upvote count */
  votes: number;
  /** Total click/play count */
  clickcount: number;
  /** Recent click trend (positive = trending up) */
  clicktrend: number;
}

// ─── Player ─────────────────────────────────────────────────────────────────

/** Repeat mode for queue playback */
export type RepeatMode = 'none' | 'one' | 'all';

/** Full player state (exposed to UI components) */
export interface PlayerState {
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Current playback position in seconds */
  currentTime: number;
  /** Total song duration in seconds (0 if unknown) */
  duration: number;
  /** Volume level 0-100 */
  volume: number;
  /** Whether audio is muted */
  isMuted: boolean;
  /** Current repeat mode */
  repeatMode: RepeatMode;
  /** Whether shuffle is enabled */
  isShuffle: boolean;
}

// ─── App ────────────────────────────────────────────────────────────────────

/** Backend search provider */
export type SearchProvider = 'piped' | 'invidious' | 'youtube';

/** Main navigation tab */
export type ActiveTab = 'music' | 'radio';

// ─── Utility Types ──────────────────────────────────────────────────────────

/** Makes specific keys required from a base type */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/** Makes specific keys optional from a base type */
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Deep readonly (prevents all nested mutation) */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/** A song that is guaranteed to have a valid duration */
export type SongWithDuration = RequireKeys<Song, 'durationSeconds'> & {
  durationSeconds: number & { min: 1 }; // > 0
};

/** A cached song that has blob data (fully offline-capable) */
export type OfflineSong = RequireKeys<CachedSong, 'blob' | 'blobUrl'>;

/** Radio station sorted by a specific metric */
export type RadioSortMetric = 'votes' | 'clickcount' | 'clicktrend';
