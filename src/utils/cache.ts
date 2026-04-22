import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import type { CachedSong } from '@/types';

// ─── Schema ─────────────────────────────────────────────────────────────────
interface MusicPlayerDB extends DBSchema {
  songs: {
    key: string; // videoId
    value: CachedSong & { cachedAt: number };
    indexes: {
      cachedAt: number;
      title: string;
    };
  };
}

// ─── Constants ──────────────────────────────────────────────────────────────
const DB_NAME = 'MusicPlayerDB';
const DB_VERSION = 1;
const STORE = 'songs' as const;
const MAX_CACHED_SONGS = 200;
const STALE_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ─── Database Connection ────────────────────────────────────────────────────
let dbPromise: Promise<IDBPDatabase<MusicPlayerDB>> | null = null;

function getDB(): Promise<IDBPDatabase<MusicPlayerDB>> {
  if (dbPromise) return dbPromise;

  dbPromise = openDB<MusicPlayerDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'videoId' });
        store.createIndex('cachedAt', 'cachedAt');
        store.createIndex('title', 'title');
      }
    },
    blocked() {
      console.warn('[Cache] Database upgrade blocked by another tab');
    },
    blocking() {
      console.warn('[Cache] This tab is blocking a database upgrade');
    },
    terminated() {
      console.warn('[Cache] Database connection terminated unexpectedly');
      dbPromise = null; // Allow reconnection
    },
  });

  // Clear promise on failure so next call retries
  dbPromise.catch(() => {
    dbPromise = null;
  });

  return dbPromise;
}

// ─── Storage Quota Check ────────────────────────────────────────────────────
async function checkStorageQuota(): Promise<boolean> {
  if (!navigator.storage?.estimate) return true; // API not available, proceed
  try {
    const { usage = 0, quota = Infinity } = await navigator.storage.estimate();
    // Allow save if using less than 90% of quota
    return usage < quota * 0.9;
  } catch {
    return true;
  }
}

// ─── Cache Eviction ─────────────────────────────────────────────────────────
async function evictIfNeeded(): Promise<void> {
  try {
    const db = await getDB();
    const count = await db.count(STORE);
    if (count < MAX_CACHED_SONGS) return;

    // Delete oldest songs until we're under the limit
    const tx = db.transaction(STORE, 'readwrite');
    const index = tx.store.index('cachedAt');
    let cursor = await index.openCursor();
    let deleted = 0;
    const toDelete = count - MAX_CACHED_SONGS + 1; // make room for new one

    while (cursor && deleted < toDelete) {
      await cursor.delete();
      deleted++;
      cursor = await cursor.continue();
    }

    await tx.done;
    console.log(`[Cache] Evicted ${deleted} old songs`);
  } catch (e) {
    console.warn('[Cache] Eviction failed:', e);
  }
}

// ─── Stale Cleanup ──────────────────────────────────────────────────────────
export async function cleanStaleSongs(): Promise<number> {
  try {
    const db = await getDB();
    const cutoff = Date.now() - STALE_THRESHOLD_MS;
    const tx = db.transaction(STORE, 'readwrite');
    const index = tx.store.index('cachedAt');
    const range = IDBKeyRange.upperBound(cutoff);
    let cursor = await index.openCursor(range);
    let deleted = 0;

    while (cursor) {
      await cursor.delete();
      deleted++;
      cursor = await cursor.continue();
    }

    await tx.done;
    if (deleted > 0) console.log(`[Cache] Cleaned ${deleted} stale songs`);
    return deleted;
  } catch (e) {
    console.warn('[Cache] Stale cleanup failed:', e);
    return 0;
  }
}

// ─── CRUD Operations ────────────────────────────────────────────────────────
export async function saveSong(song: CachedSong): Promise<void> {
  try {
    const hasQuota = await checkStorageQuota();
    if (!hasQuota) {
      console.warn('[Cache] Storage quota nearly full');
      await evictIfNeeded();
    }

    await evictIfNeeded();
    const db = await getDB();
    await db.put(STORE, { ...song, cachedAt: Date.now() });
  } catch (e) {
    console.error('[Cache] saveSong error:', e);
  }
}

export async function saveSongs(songs: CachedSong[]): Promise<void> {
  if (!songs.length) return;
  try {
    const db = await getDB();
    const now = Date.now();
    const tx = db.transaction(STORE, 'readwrite');

    for (const song of songs) {
      await tx.store.put({ ...song, cachedAt: now });
    }

    await tx.done;
    console.log(`[Cache] Saved ${songs.length} songs`);
  } catch (e) {
    console.error('[Cache] saveSongs error:', e);
  }
}

export async function getSong(videoId: string): Promise<CachedSong | undefined> {
  try {
    const db = await getDB();
    return await db.get(STORE, videoId);
  } catch (e) {
    console.error('[Cache] getSong error:', e);
    return undefined;
  }
}

export async function getAllSongs(): Promise<CachedSong[]> {
  try {
    const db = await getDB();
    return await db.getAll(STORE);
  } catch (e) {
    console.error('[Cache] getAllSongs error:', e);
    return [];
  }
}

export async function deleteSong(videoId: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(STORE, videoId);
  } catch (e) {
    console.error('[Cache] deleteSong error:', e);
  }
}

export async function deleteSongs(videoIds: string[]): Promise<void> {
  if (!videoIds.length) return;
  try {
    const db = await getDB();
    const tx = db.transaction(STORE, 'readwrite');

    for (const id of videoIds) {
      await tx.store.delete(id);
    }

    await tx.done;
  } catch (e) {
    console.error('[Cache] deleteSongs error:', e);
  }
}

export async function clearAllSongs(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear(STORE);
  } catch (e) {
    console.error('[Cache] clearAllSongs error:', e);
  }
}

export async function getSongCount(): Promise<number> {
  try {
    const db = await getDB();
    return await db.count(STORE);
  } catch {
    return 0;
  }
}

// ─── Search by Title ────────────────────────────────────────────────────────
export async function searchCachedSongs(query: string): Promise<CachedSong[]> {
  if (!query.trim()) return getAllSongs();
  try {
    const db = await getDB();
    const all = await db.getAll(STORE);
    const q = query.toLowerCase();
    return all.filter(
      (s) =>
        s.title?.toLowerCase().includes(q) ||
        s.artist?.toLowerCase().includes(q),
    );
  } catch (e) {
    console.error('[Cache] searchCachedSongs error:', e);
    return [];
  }
}

// ─── Storage Info ───────────────────────────────────────────────────────────
export async function getStorageInfo(): Promise<{
  songCount: number;
  usage: number;
  quota: number;
  usagePercent: number;
}> {
  const songCount = await getSongCount();
  let usage = 0;
  let quota = Infinity;

  try {
    if (navigator.storage?.estimate) {
      const est = await navigator.storage.estimate();
      usage = est.usage ?? 0;
      quota = est.quota ?? Infinity;
    }
  } catch {}

  return {
    songCount,
    usage,
    quota,
    usagePercent: quota > 0 ? Math.round((usage / quota) * 100) : 0,
  };
}

// ─── Database Reset ─────────────────────────────────────────────────────────
export async function resetDatabase(): Promise<void> {
  try {
    if (dbPromise) {
      const db = await dbPromise;
      db.close();
    }
  } catch {}
  dbPromise = null;

  try {
    await indexedDB.deleteDatabase(DB_NAME);
    console.log('[Cache] Database deleted');
  } catch (e) {
    console.error('[Cache] Failed to delete database:', e);
  }
}
