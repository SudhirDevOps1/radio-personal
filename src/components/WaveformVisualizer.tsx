import { useEffect, useRef } from 'react';

interface Props {
    isPlaying: boolean;
    darkMode: boolean;
}

const BAR_COUNT = 48;
const BAR_GAP = 1.5;
const LERP_FACTOR = 0.75;

export default function WaveformVisualizer({ isPlaying, darkMode }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);
    const timeRef = useRef(0);
    const barsRef = useRef<number[]>(Array.from({ length: BAR_COUNT }, () => 0.05));
    const isPlayingRef = useRef(isPlaying);
    const darkModeRef = useRef(darkMode);
    const dimsRef = useRef({ w: 0, h: 0 });
    const gradRef = useRef<CanvasGradient | null>(null);
    const prevDarkRef = useRef(darkMode);

    // Sync props to refs (avoids re-running the entire effect)
    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
    useEffect(() => { darkModeRef.current = darkMode; }, [darkMode]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        // alpha: false = faster compositing (browser skips blending)
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        const updateSize = () => {
            const W = canvas.clientWidth;
            const H = canvas.clientHeight;
            if (dimsRef.current.w !== W || dimsRef.current.h !== H) {
                canvas.width = W;
                canvas.height = H;
                dimsRef.current = { w: W, h: H };
                gradRef.current = null; // force gradient rebuild
            }
        };

        const getGradient = () => {
            if (gradRef.current && prevDarkRef.current === darkModeRef.current) {
                return gradRef.current;
            }
            const H = dimsRef.current.h;
            const grad = ctx.createLinearGradient(0, 0, 0, H);
            if (darkModeRef.current) {
                grad.addColorStop(0, '#a78bfa');
                grad.addColorStop(0.5, '#ec4899');
                grad.addColorStop(1, '#f59e0b');
            } else {
                grad.addColorStop(0, '#7c3aed');
                grad.addColorStop(0.5, '#db2777');
                grad.addColorStop(1, '#d97706');
            }
            gradRef.current = grad;
            prevDarkRef.current = darkModeRef.current;
            return grad;
        };

        // Use ResizeObserver instead of checking offsetWidth every frame
        const ro = new ResizeObserver(() => updateSize());
        ro.observe(canvas);
        updateSize();

        function draw() {
            if (!canvas || !ctx) return;
            const { w: W, h: H } = dimsRef.current;
            if (W === 0 || H === 0) {
                rafRef.current = requestAnimationFrame(draw);
                return;
            }

            ctx.clearRect(0, 0, W, H);

            timeRef.current += 0.04;
            const t = timeRef.current;
            const playing = isPlayingRef.current;

            const barW = W / BAR_COUNT - BAR_GAP;
            const grad = getGradient();
            const r = Math.min(barW / 2, 4);

            // ✅ Batch all bars into ONE path (1 draw call instead of 48)
            ctx.fillStyle = grad;
            ctx.beginPath();

            for (let i = 0; i < BAR_COUNT; i++) {
                let target: number;
                if (playing) {
                    target =
                        0.1 +
                        0.45 * Math.abs(Math.sin(t * 1.8 + i * 0.35)) +
                        0.25 * Math.abs(Math.sin(t * 3.2 + i * 0.7)) +
                        0.1 * Math.abs(Math.sin(t * 0.9 + i * 0.15));
                } else {
                    target = 0.04 + 0.02 * Math.abs(Math.sin(t * 0.4 + i * 0.2));
                }

                barsRef.current[i] = barsRef.current[i] * LERP_FACTOR + target * (1 - LERP_FACTOR);

                const bh = barsRef.current[i] * H;
                const x = i * (barW + BAR_GAP);
                const y = (H - bh) / 2;

                ctx.roundRect(x, y, barW, bh, r);
            }

            ctx.fill(); // Single fill for all bars

            rafRef.current = requestAnimationFrame(draw);
        }

        rafRef.current = requestAnimationFrame(draw);

        // Pause animation when tab is hidden (battery saver)
        const handleVisibility = () => {
            if (document.hidden) {
                cancelAnimationFrame(rafRef.current);
            } else {
                rafRef.current = requestAnimationFrame(draw);
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            cancelAnimationFrame(rafRef.current);
            ro.disconnect();
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, []); // Mount once — no re-runs

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-12 block"
            aria-hidden="true"
        />
    );
}
