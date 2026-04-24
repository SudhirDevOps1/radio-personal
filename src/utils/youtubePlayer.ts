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

// ─── Window Type Extension ──────────────────────────────────────────────────
declare global {
    interface Window {
        YT?: {
            Player: new (id: string | HTMLElement, opts: any) => any;
        };
        onYouTubeIframeAPIReady?: () => void;
        _ytPlayer?: YTPlayer;
    }
}

// ─── Constants ──────────────────────────────────────────────────────────────
const DEFAULT_CONTAINER_ID = 'yt-hidden-player-container';
const SCRIPT_ID = 'yt-iframe-api-script';
const SCRIPT_TIMEOUT = 15000;
const READY_TIMEOUT = 10000;

// ─── Module State ───────────────────────────────────────────────────────────
let scriptLoadPromise: Promise<void> | null = null;
let playerReadyPromise: Promise<YTPlayer> | null = null;

// ─── YouTube Error Codes ────────────────────────────────────────────────────
const YT_ERROR_MESSAGES: Record<number, string> = {
    2: 'Invalid parameter',
    5: 'HTML5 player error',
    100: 'Video not found',
    101: 'Video not allowed in embedded players',
    150: 'Video not allowed in embedded players',
};

// ─── Script Loader ──────────────────────────────────────────────────────────
function loadYTScript(): Promise<void> {
    if (window.YT?.Player) return Promise.resolve();

    if (scriptLoadPromise) return scriptLoadPromise;

    scriptLoadPromise = new Promise<void>((resolve, reject) => {
        // Inject script if not already present
        if (!document.getElementById(SCRIPT_ID)) {
            const tag = document.createElement('script');
            tag.id = SCRIPT_ID;
            tag.src = 'https://www.youtube.com/iframe_api';
            tag.onerror = () => {
                scriptLoadPromise = null; // Allow retry
                reject(new Error('Failed to load YouTube IFrame API script'));
            };
            document.head.appendChild(tag);
        }

        // Robust polling: checks every 100ms if YT.Player is available.
        // More reliable than relying solely on the global callback,
        // which can be overwritten by other libraries.
        const poll = setInterval(() => {
            if (window.YT?.Player) {
                clearInterval(poll);
                resolve();
            }
        }, 100);

        // Timeout fallback
        setTimeout(() => {
            clearInterval(poll);
            if (window.YT?.Player) {
                resolve();
            } else {
                scriptLoadPromise = null; // Allow retry
                reject(new Error('YouTube IFrame API load timeout'));
            }
        }, SCRIPT_TIMEOUT);
    });

    return scriptLoadPromise;
}

// ─── Player Initialization ──────────────────────────────────────────────────
export async function initYouTubePlayer(
    containerId: string = DEFAULT_CONTAINER_ID,
    callbacks: PlayerCallbacks = {},
): Promise<YTPlayer> {
    if (playerReadyPromise) return playerReadyPromise;

    playerReadyPromise = (async () => {
        await loadYTScript();

        return new Promise<YTPlayer>((resolve, reject) => {
            // Ensure container exists
            let container = document.getElementById(containerId);
            if (!container) {
                container = document.createElement('div');
                container.id = containerId;
                container.setAttribute('aria-hidden', 'true');
                container.style.cssText =
                    'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;pointer-events:none;opacity:0;';
                document.body.appendChild(container);
            }

            // Safety timeout for onReady
            const readyTimer = setTimeout(() => {
                reject(new Error('YouTube Player onReady timeout'));
            }, READY_TIMEOUT);

            const player = new window.YT!.Player(containerId, {
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
                        clearTimeout(readyTimer);
                        window._ytPlayer = player as YTPlayer;
                        callbacks.onReady?.();
                        resolve(player as YTPlayer);
                    },
                    onStateChange: (e: any) => {
                        callbacks.onStateChange?.({ data: e.data });
                    },
                    onError: (e: any) => {
                        const code = e.data as number;
                        const msg = YT_ERROR_MESSAGES[code] || `Unknown error (${code})`;
                        console.error(`[YT] Player error: ${msg}`);
                        callbacks.onError?.({ data: code });
                    },
                },
            });
        });
    })();

    // If initialization fails, clear promise so it can be retried
    playerReadyPromise.catch(() => {
        playerReadyPromise = null;
    });

    return playerReadyPromise;
}

// ─── Player Access ──────────────────────────────────────────────────────────
export function getYTPlayer(): YTPlayer | null {
    return window._ytPlayer || null;
}

// ─── Player Cleanup ─────────────────────────────────────────────────────────
export function resetPlayer(): void {
    playerReadyPromise = null;

    try {
        const p = window._ytPlayer;
        if (p && typeof p.destroy === 'function') p.destroy();
    } catch (e) {
        console.warn('[YT] Error destroying player:', e);
    }

    window._ytPlayer = undefined;

    // Clean up hidden container to prevent DOM bloat (e.g., during HMR)
    const container = document.getElementById(DEFAULT_CONTAINER_ID);
    if (container) container.remove();
}
// ─── WebView Audio Unlock ──────────────────────────────────────────────────
// Android WebView requires a user gesture before audio can play.
// Call this on first interaction to unlock the audio channel.

let audioUnlocked = false;

export function unlockWebViewAudio(): void {
  if (audioUnlocked) return;
  audioUnlocked = true;

  try {
    // Create and immediately play a tiny silent buffer
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    ctx.close();
  } catch {}

  // Also try resuming any existing AudioContext
  try {
    const contexts = (window as any).__audioContexts || [];
    contexts.forEach((ctx: any) => {
      if (ctx.state === 'suspended') ctx.resume();
    });
  } catch {}
}

// Auto-unlock on first user gesture
if (typeof document !== 'undefined') {
  const unlock = () => unlockWebViewAudio();
  document.addEventListener('click', unlock, { once: true });
  document.addEventListener('touchstart', unlock, { once: true });
  document.addEventListener('keydown', unlock, { once: true });
}