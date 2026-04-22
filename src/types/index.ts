export interface Song {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: string;
  durationSeconds: number;
}

export interface CachedSong extends Song {
  blob?: Blob;
  blobUrl?: string;
  cachedAt: number;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface Artist {
  id: string;
  name: string;
  genre: string;
  image: string;
  searchQuery?: string;
}

export interface Mood {
  id: string;
  name: string;
  query: string;
  icon: string;
  gradient: string;
}

export interface RadioStation {
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  favicon: string;
  tags: string;
  country: string;
  language: string;
  bitrate: number;
  codec: string;
  votes: number;
  clickcount: number;
  clicktrend: number;
}

export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: 'none' | 'one' | 'all';
  isShuffle: boolean;
}

export type SearchProvider = 'piped' | 'invidious' | 'youtube';
export type ActiveTab = 'music' | 'radio';
