// import type { Song } from '@/types';

// // ─── Media Session API ────────────────────────────────────
// // Provides lock screen controls + background playback hint

// let keepAliveInterval: ReturnType<typeof setInterval> | null = null;
// let swRegistration: ServiceWorkerRegistration | null = null;

// async function getSW(): Promise<ServiceWorker | null> {
//     if (!('serviceWorker' in navigator)) return null;
//     try {
//         swRegistration = await navigator.serviceWorker.ready;
//         return swRegistration?.active || null;
//     } catch {
//         return null;
//     }
// }

// // ─── Start background keep-alive ──────────────────────────
// export function startBackgroundKeepAlive(song: Song): void {
//     stopBackgroundKeepAlive();

//     // Tell service worker audio is playing
//     getSW().then((sw) => {
//         sw?.postMessage({ type: 'AUDIO_PLAYING', song: { title: song.title, artist: song.artist } });
//     });

//     // Send keep-alive every 20 seconds to prevent SW from being killed
//     keepAliveInterval = setInterval(() => {
//         getSW().then((sw) => {
//             sw?.postMessage({ type: 'KEEP_ALIVE' });
//         });
//     }, 20000);
// }

// // ─── Stop background keep-alive ───────────────────────────
// export function stopBackgroundKeepAlive(): void {
//     if (keepAliveInterval) {
//         clearInterval(keepAliveInterval);
//         keepAliveInterval = null;
//     }
//     getSW().then((sw) => {
//         sw?.postMessage({ type: 'AUDIO_STOPPED' });
//     });
// }

// // ─── Update Media Session metadata ────────────────────────
// export function updateMediaSession(song: Song): void {
//     if (!('mediaSession' in navigator)) return;

//     navigator.mediaSession.metadata = new MediaMetadata({
//         title: song.title,
//         artist: song.artist,
//         album: 'PrivMITLab',
//         artwork: [
//             { src: song.thumbnail, sizes: '96x96', type: 'image/jpeg' },
//             { src: song.thumbnail, sizes: '128x128', type: 'image/jpeg' },
//             { src: song.thumbnail, sizes: '192x192', type: 'image/jpeg' },
//             { src: song.thumbnail, sizes: '256x256', type: 'image/jpeg' },
//             { src: song.thumbnail, sizes: '384x384', type: 'image/jpeg' },
//             { src: song.thumbnail, sizes: '512x512', type: 'image/jpeg' },
//         ],
//     });
// }

// // ─── Set Media Session action handlers ────────────────────
// export function setupMediaSessionActions(handlers: {
//     onPlay?: () => void;
//     onPause?: () => void;
//     onNext?: () => void;
//     onPrevious?: () => void;
//     onSeekTo?: (time: number) => void;
//     onStop?: () => void;
// }): void {
//     if (!('mediaSession' in navigator)) return;

//     try { navigator.mediaSession.setActionHandler('play', () => handlers.onPlay?.()); } catch { }
//     try { navigator.mediaSession.setActionHandler('pause', () => handlers.onPause?.()); } catch { }
//     try { navigator.mediaSession.setActionHandler('nexttrack', () => handlers.onNext?.()); } catch { }
//     try { navigator.mediaSession.setActionHandler('previoustrack', () => handlers.onPrevious?.()); } catch { }
//     try { navigator.mediaSession.setActionHandler('seekto', (details) => handlers.onSeekTo?.(details.seekTime ?? 0)); } catch { }
//     try { navigator.mediaSession.setActionHandler('stop', () => handlers.onStop?.()); } catch { }
// }

// // ─── Update playback state (for lock screen) ──────────────
// export function updateMediaSessionState(state: {
//     isPlaying: boolean;
//     currentTime: number;
//     duration: number;
// }): void {
//     if (!('mediaSession' in navigator)) return;

//     try {
//         navigator.mediaSession.playbackState = state.isPlaying ? 'playing' : 'paused';

//         if ('setPositionState' in navigator.mediaSession) {
//             navigator.mediaSession.setPositionState({
//                 duration: Math.max(0, state.duration || 0),
//                 playbackRate: 1,
//                 position: Math.min(Math.max(0, state.currentTime || 0), Math.max(0, state.duration || 0)),
//             });
//         }
//     } catch { }
// }
import type { Song } from '@/types';

// ─── Background Keep-Alive ────────────────────────────────
let keepAliveInterval: ReturnType<typeof setInterval> | null = null;

async function getSW(): Promise<ServiceWorker | null> {
    if (!('serviceWorker' in navigator)) return null;
    try {
        const reg = await navigator.serviceWorker.ready;
        return reg?.active || null;
    } catch { return null; }
}

export function startBackgroundKeepAlive(song: Song): void {
    stopBackgroundKeepAlive();

    getSW().then((sw) => {
        sw?.postMessage({
            type: 'AUDIO_PLAYING',
            song: { title: song.title, artist: song.artist },
        });
    });

    keepAliveInterval = setInterval(() => {
        getSW().then((sw) => sw?.postMessage({ type: 'KEEP_ALIVE' }));
    }, 20000);
}

export function stopBackgroundKeepAlive(): void {
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
    }
    getSW().then((sw) => sw?.postMessage({ type: 'AUDIO_STOPPED' }));
}

// ─── Media Session Metadata ───────────────────────────────
export function updateMediaSessionMetadata(song: Song): void {
    if (!('mediaSession' in navigator)) return;
    try {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: song.title,
            artist: song.artist,
            album: 'PrivMITLab Music',
            artwork: [
                { src: song.thumbnail, sizes: '96x96', type: 'image/jpeg' },
                { src: song.thumbnail, sizes: '128x128', type: 'image/jpeg' },
                { src: song.thumbnail, sizes: '192x192', type: 'image/jpeg' },
                { src: song.thumbnail, sizes: '256x256', type: 'image/jpeg' },
                { src: song.thumbnail, sizes: '384x384', type: 'image/jpeg' },
                { src: song.thumbnail, sizes: '512x512', type: 'image/jpeg' },
            ],
        });
    } catch { }
}

// ─── Media Session Playback State ─────────────────────────
export function updateMediaSessionPlayback(isPlaying: boolean): void {
    if (!('mediaSession' in navigator)) return;
    try {
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    } catch { }
}

// ─── Media Session Position State ─────────────────────────
export function updateMediaSessionPosition(
    currentTime: number,
    duration: number,
): void {
    if (!('mediaSession' in navigator)) return;
    try {
        if ('setPositionState' in navigator.mediaSession) {
            navigator.mediaSession.setPositionState({
                duration: Math.max(0, duration || 0),
                playbackRate: 1,
                position: Math.min(Math.max(0, currentTime || 0), Math.max(0, duration || 0)),
            });
        }
    } catch { }
}