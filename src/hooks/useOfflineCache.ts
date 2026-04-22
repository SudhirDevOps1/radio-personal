import { useState, useEffect, useCallback } from 'react';
import type { CachedSong } from '@/types';
import { getAllSongs, clearAllSongs } from '@/utils/cache';

export function useOfflineCache() {
  const [cachedSongs, setCachedSongs] = useState<CachedSong[]>([]);

  const loadCachedSongs = useCallback(async () => {
    try {
      const songs = await getAllSongs();
      setCachedSongs(songs.sort((a, b) => b.cachedAt - a.cachedAt));
    } catch (e) {
      console.error('[OfflineCache] load error:', e);
    }
  }, []);

  useEffect(() => {
    loadCachedSongs();
  }, [loadCachedSongs]);

  const handleClearCache = useCallback(async () => {
    await clearAllSongs();
    setCachedSongs([]);
  }, []);

  const refreshCache = useCallback(() => {
    loadCachedSongs();
  }, [loadCachedSongs]);

  return { cachedSongs, handleClearCache, refreshCache };
}
