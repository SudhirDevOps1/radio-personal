/* eslint-disable @typescript-eslint/no-explicit-any */

export enum PlayerState {
  UNSTARTED = -1,
  ENDED = 0,
  PLAYING = 1,
  PAUSED = 2,
  BUFFERING = 3,
  VIDEO_CUED = 5,
}

export interface YTPlayer {
  loadVideoById(videoId: string, startSeconds?: number): void;
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setVolume(volume: number): void;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  getVolume(): number;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  destroy(): void;
}

interface PlayerCallbacks {
  onReady?: () => void;
  onStateChange?: (event: { data: number }) => void;
  onError?: (event: { data: number }) => void;
}

let playerReadyPromise: Promise<YTPlayer> | null = null;

function loadYTScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).YT?.Player) {
      resolve();
      return;
    }
    if (document.getElementById('yt-iframe-api-script')) {
      const poll = setInterval(() => {
        if ((window as any).YT?.Player) {
          clearInterval(poll);
          resolve();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(poll);
        reject(new Error('YT API timeout'));
      }, 20000);
      return;
    }
    const tag = document.createElement('script');
    tag.id = 'yt-iframe-api-script';
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.onerror = () => reject(new Error('Failed to load YouTube IFrame API'));
    document.head.appendChild(tag);

    (window as any).onYouTubeIframeAPIReady = () => resolve();
    setTimeout(() => reject(new Error('YT API timeout')), 20000);
  });
}

export async function initYouTubePlayer(
  containerId: string,
  callbacks: PlayerCallbacks = {},
): Promise<YTPlayer> {
  if (playerReadyPromise) return playerReadyPromise;

  playerReadyPromise = (async () => {
    await loadYTScript();

    return new Promise<YTPlayer>((resolve, _reject) => {
      let container = document.getElementById(containerId);
      if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.style.cssText =
          'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;pointer-events:none;';
        document.body.appendChild(container);
      }

      const player = new (window as any).YT.Player(containerId, {
        width: '1',
        height: '1',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            (window as any)._ytPlayer = player;
            callbacks.onReady?.();
            resolve(player as YTPlayer);
          },
          onStateChange: (e: any) => callbacks.onStateChange?.({ data: e.data }),
          onError: (e: any) => {
            console.error('[YT] Player error code:', e.data);
            callbacks.onError?.({ data: e.data });
          },
        },
      });
    });
  })();

  return playerReadyPromise;
}

export function getYTPlayer(): YTPlayer | null {
  return (window as any)._ytPlayer || null;
}

export function resetPlayer(): void {
  playerReadyPromise = null;
  try {
    const p = (window as any)._ytPlayer;
    if (p) p.destroy();
  } catch {
    // ignore
  }
  (window as any)._ytPlayer = null;
}
