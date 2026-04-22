import { openDB, type IDBPDatabase } from 'idb';
import type { CachedSong } from '@/types';

const DB_NAME = 'MusicPlayerDB';
const DB_VERSION = 1;
const STORE = 'songs';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'videoId' });
          store.createIndex('cachedAt', 'cachedAt');
          store.createIndex('title', 'title');
        }
      },
    });
  }
  return dbPromise;
}

export async function saveSong(song: CachedSong): Promise<void> {
  try {
    const db = await getDB();
    await db.put(STORE, { ...song, cachedAt: Date.now() });
  } catch (e) {
    console.error('[Cache] saveSong error:', e);
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
