import { useState, useEffect, useCallback, useRef } from 'react';
import type { CachedSong } from '@/types';
import { getAllSongs, clearAllSongs } from '@/utils/cache';

export function useOfflineCache() {
    const [cachedSongs, setCachedSongs] = useState<CachedSong[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isMountedRef = useRef(true);

    // Track mount status to prevent state updates on unmounted components
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const loadCachedSongs = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const songs = await getAllSongs();
            if (!isMountedRef.current) return;

            // Spread first to avoid mutating the original array reference
            setCachedSongs([...songs].sort((a, b) => b.cachedAt - a.cachedAt));
        } catch (e) {
            if (!isMountedRef.current) return;
            setError('Failed to load cached songs');
            console.error('[OfflineCache] load error:', e);
        } finally {
            if (isMountedRef.current) {
                setIsLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        loadCachedSongs();
    }, [loadCachedSongs]);

    const handleClearCache = useCallback(async () => {
        setError(null);
        try {
            await clearAllSongs();
            if (!isMountedRef.current) return;
            setCachedSongs([]);
        } catch (e) {
            if (!isMountedRef.current) return;
            setError('Failed to clear cache');
            console.error('[OfflineCache] clear error:', e);
        }
    }, []);

    const refreshCache = useCallback(() => {
        loadCachedSongs();
    }, [loadCachedSongs]);

    return { cachedSongs, isLoading, error, handleClearCache, refreshCache };
}
