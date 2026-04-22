import { useState, useRef, useCallback, useEffect } from 'react';
import type { Song, PlayerState } from '@/types';
import { getYTPlayer, PlayerState as YTState } from '@/utils/youtubePlayer';

const DEFAULT_STATE: PlayerState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 80,
  isMuted: false,
  repeatMode: 'none',
  isShuffle: false,
};

export function usePlayer(queue: Song[]) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>(DEFAULT_STATE);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentIndexRef = useRef(-1);
  const queueRef = useRef<Song[]>(queue);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef(playerState);

  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { stateRef.current = playerState; }, [playerState]);

  // Poll YT player progress
  const startPolling = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const yt = getYTPlayer();
      if (!yt) return;
      try {
        const state = yt.getPlayerState();
        const ct = yt.getCurrentTime() || 0;
        const dur = yt.getDuration() || 0;
        const playing = state === YTState.PLAYING;

        setIsPlaying(playing);
        setPlayerState((prev) => ({ ...prev, currentTime: ct, duration: dur }));
      } catch {
        // YT not ready yet
      }
    }, 500);
  }, []);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Update Media Session
  const updateMediaSession = useCallback((song: Song) => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      album: 'PrivMITLab Music',
      artwork: [
        { src: song.thumbnail, sizes: '480x360', type: 'image/jpeg' },
      ],
    });
  }, []);

  const playSong = useCallback((song: Song, q?: Song[]) => {
    const queue = q || queueRef.current;
    const idx = queue.findIndex((s) => s.videoId === song.videoId);
    currentIndexRef.current = idx >= 0 ? idx : 0;

    setCurrentSong(song);
    updateMediaSession(song);

    const yt = getYTPlayer();
    if (yt) {
      try {
        yt.loadVideoById(song.videoId);
        setIsPlaying(true);
        setPlayerState((prev) => ({ ...prev, isPlaying: true, currentTime: 0, duration: 0 }));
        startPolling();
      } catch (e) {
        console.error('[Player] loadVideoById failed:', e);
      }
    } else {
      console.warn('[Player] YT not ready, retrying in 1s');
      setTimeout(() => {
        const ytRetry = getYTPlayer();
        if (ytRetry) {
          ytRetry.loadVideoById(song.videoId);
          setIsPlaying(true);
          startPolling();
        }
      }, 1000);
    }
  }, [updateMediaSession, startPolling]);

  const togglePlay = useCallback(() => {
    const yt = getYTPlayer();
    if (!yt || !currentSong) return;
    try {
      const state = yt.getPlayerState();
      if (state === YTState.PLAYING) {
        yt.pauseVideo();
        setIsPlaying(false);
      } else {
        yt.playVideo();
        setIsPlaying(true);
      }
    } catch (e) {
      console.error('[Player] togglePlay error:', e);
    }
  }, [currentSong]);

  const next = useCallback(() => {
    const q = queueRef.current;
    if (!q.length) return;
    const st = stateRef.current;

    let nextIdx: number;
    if (st.isShuffle) {
      nextIdx = Math.floor(Math.random() * q.length);
    } else if (st.repeatMode === 'one') {
      nextIdx = currentIndexRef.current;
    } else {
      nextIdx = currentIndexRef.current + 1;
      if (nextIdx >= q.length) {
        if (st.repeatMode === 'all') nextIdx = 0;
        else return; // stop
      }
    }
    currentIndexRef.current = nextIdx;
    const song = q[nextIdx];
    if (song) playSong(song, q);
  }, [playSong]);

  const previous = useCallback(() => {
    const q = queueRef.current;
    if (!q.length) return;
    let prevIdx = currentIndexRef.current - 1;
    if (prevIdx < 0) prevIdx = 0;
    currentIndexRef.current = prevIdx;
    const song = q[prevIdx];
    if (song) playSong(song, q);
  }, [playSong]);

  const seek = useCallback((seconds: number) => {
    const yt = getYTPlayer();
    if (!yt) return;
    try {
      yt.seekTo(seconds, true);
      setPlayerState((prev) => ({ ...prev, currentTime: seconds }));
    } catch {}
  }, []);

  const seekForward = useCallback(() => {
    const yt = getYTPlayer();
    if (!yt) return;
    try { seek(yt.getCurrentTime() + 10); } catch {}
  }, [seek]);

  const seekBackward = useCallback(() => {
    const yt = getYTPlayer();
    if (!yt) return;
    try { seek(Math.max(0, yt.getCurrentTime() - 10)); } catch {}
  }, [seek]);

  const setVolume = useCallback((vol: number) => {
    const yt = getYTPlayer();
    const clamped = Math.max(0, Math.min(100, vol));
    if (yt) {
      try {
        yt.setVolume(clamped);
        if (clamped > 0 && yt.isMuted()) yt.unMute();
      } catch {}
    }
    setPlayerState((prev) => ({ ...prev, volume: clamped, isMuted: clamped === 0 }));
  }, []);

  const toggleMute = useCallback(() => {
    const yt = getYTPlayer();
    if (!yt) return;
    try {
      if (yt.isMuted()) {
        yt.unMute();
        setPlayerState((prev) => ({ ...prev, isMuted: false }));
      } else {
        yt.mute();
        setPlayerState((prev) => ({ ...prev, isMuted: true }));
      }
    } catch {}
  }, []);

  const toggleShuffle = useCallback(() => {
    setPlayerState((prev) => ({ ...prev, isShuffle: !prev.isShuffle }));
  }, []);

  const setRepeatMode = useCallback((mode: 'none' | 'one' | 'all') => {
    setPlayerState((prev) => ({ ...prev, repeatMode: mode }));
  }, []);

  // Register Media Session handlers
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.setActionHandler('play', () => {
      const yt = getYTPlayer();
      if (yt) { try { yt.playVideo(); setIsPlaying(true); } catch {} }
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      const yt = getYTPlayer();
      if (yt) { try { yt.pauseVideo(); setIsPlaying(false); } catch {} }
    });
    navigator.mediaSession.setActionHandler('nexttrack', next);
    navigator.mediaSession.setActionHandler('previoustrack', previous);
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime != null) seek(details.seekTime);
    });
  }, [next, previous, seek]);

  // Apply initial volume
  useEffect(() => {
    const yt = getYTPlayer();
    if (yt) {
      try { yt.setVolume(playerState.volume); } catch {}
    }
  });

  useEffect(() => () => stopPolling(), [stopPolling]);

  return {
    currentSong,
    isPlaying,
    playerState,
    playSong,
    togglePlay,
    next,
    previous,
    seek,
    seekForward,
    seekBackward,
    setVolume,
    toggleMute,
    toggleShuffle,
    setRepeatMode,
  };
}
