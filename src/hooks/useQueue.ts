import { useState, useCallback } from 'react';
import type { Song } from '@/types';

export function useQueue() {
  const [queue, setQueue] = useState<Song[]>([]);

  const addToQueue = useCallback((song: Song) => {
    setQueue((prev) => {
      if (prev.some((s) => s.videoId === song.videoId)) return prev;
      return [...prev, song];
    });
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearQueue = useCallback(() => setQueue([]), []);

  const reorderQueue = useCallback((from: number, to: number) => {
    setQueue((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  }, []);

  const addMultipleToQueue = useCallback((songs: Song[]) => {
    setQueue((prev) => {
      const existingIds = new Set(prev.map((s) => s.videoId));
      const newSongs = songs.filter((s) => !existingIds.has(s.videoId));
      return [...prev, ...newSongs];
    });
  }, []);

  return { queue, addToQueue, removeFromQueue, clearQueue, reorderQueue, addMultipleToQueue };
}
