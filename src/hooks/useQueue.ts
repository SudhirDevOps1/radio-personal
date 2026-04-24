import { useState, useCallback, useRef } from 'react';
import type { Song } from '@/types';

export function useQueue() {
    const [queue, setQueue] = useState<Song[]>([]);
    // O(1) lookup set for blazing fast duplicate checks
    const idSetRef = useRef<Set<string>>(new Set());

    const addToQueue = useCallback((song: Song) => {
        if (!song?.videoId) return;
        setQueue((prev) => {
            if (idSetRef.current.has(song.videoId)) return prev;
            idSetRef.current.add(song.videoId);
            return [...prev, song];
        });
    }, []);

    const removeById = useCallback((videoId: string) => {
        setQueue((prev) => {
            if (!idSetRef.current.has(videoId)) return prev;
            idSetRef.current.delete(videoId);
            return prev.filter((s) => s.videoId !== videoId);
        });
    }, []);

    const removeFromQueue = useCallback((index: number) => {
        setQueue((prev) => {
            if (index < 0 || index >= prev.length) return prev;
            idSetRef.current.delete(prev[index].videoId);
            return prev.filter((_, i) => i !== index);
        });
    }, []);

    const clearQueue = useCallback(() => {
        idSetRef.current.clear();
        setQueue([]);
    }, []);

    const reorderQueue = useCallback((from: number, to: number) => {
        setQueue((prev) => {
            if (
                from < 0 || from >= prev.length ||
                to < 0 || to >= prev.length ||
                from === to
            ) return prev;
            const arr = [...prev];
            const [item] = arr.splice(from, 1);
            arr.splice(to, 0, item);
            return arr;
        });
    }, []);

    const addMultipleToQueue = useCallback((songs: Song[]) => {
        if (!songs?.length) return;
        setQueue((prev) => {
            const newSongs: Song[] = [];
            for (const song of songs) {
                if (song?.videoId && !idSetRef.current.has(song.videoId)) {
                    idSetRef.current.add(song.videoId);
                    newSongs.push(song);
                }
            }
            return newSongs.length ? [...prev, ...newSongs] : prev;
        });
    }, []);

    // ─── New Powerful Additions ──────────────────────────────────────────────

    const replaceQueue = useCallback((songs: Song[]) => {
        const uniqueSongs: Song[] = [];
        const newSet = new Set<string>();

        for (const song of songs) {
            if (song?.videoId && !newSet.has(song.videoId)) {
                newSet.add(song.videoId);
                uniqueSongs.push(song);
            }
        }

        idSetRef.current = newSet;
        setQueue(uniqueSongs);
    }, []);

    const playNext = useCallback((song: Song) => {
        if (!song?.videoId) return;
        setQueue((prev) => {
            const arr = prev.filter((s) => s.videoId !== song.videoId);
            // Insert at index 1 (right after the currently playing song)
            arr.splice(1, 0, song);
            idSetRef.current.add(song.videoId);
            return arr;
        });
    }, []);

    const shuffleQueue = useCallback(() => {
        setQueue((prev) => {
            if (prev.length <= 1) return prev;
            const arr = [...prev];
            // Fisher-Yates shuffle (truly random, unbiased)
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        });
    }, []);

    return {
        queue,
        addToQueue,
        removeFromQueue,
        removeById,
        clearQueue,
        reorderQueue,
        addMultipleToQueue,
        replaceQueue,
        playNext,
        shuffleQueue,
    };
}
