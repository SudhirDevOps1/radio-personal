import { useEffect, useRef } from 'react';

interface Props {
  isPlaying: boolean;
  darkMode: boolean;
}

export default function WaveformVisualizer({ isPlaying, darkMode }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);
  const barsRef = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const BAR_COUNT = 48;
    // initialise bar heights
    if (barsRef.current.length === 0) {
      barsRef.current = Array.from({ length: BAR_COUNT }, () => 0.05);
    }

    function draw() {
      if (!canvas || !ctx) return;
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      if (canvas.width !== W) canvas.width = W;
      if (canvas.height !== H) canvas.height = H;

      ctx.clearRect(0, 0, W, H);

      timeRef.current += 0.04;
      const t = timeRef.current;

      const barW = W / BAR_COUNT - 1.5;
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      if (darkMode) {
        grad.addColorStop(0, '#a78bfa');
        grad.addColorStop(0.5, '#ec4899');
        grad.addColorStop(1, '#f59e0b');
      } else {
        grad.addColorStop(0, '#7c3aed');
        grad.addColorStop(0.5, '#db2777');
        grad.addColorStop(1, '#d97706');
      }

      for (let i = 0; i < BAR_COUNT; i++) {
        let target: number;
        if (isPlaying) {
          // rhythmic sine simulation
          target =
            0.1 +
            0.45 * Math.abs(Math.sin(t * 1.8 + i * 0.35)) +
            0.25 * Math.abs(Math.sin(t * 3.2 + i * 0.7)) +
            0.1 * Math.abs(Math.sin(t * 0.9 + i * 0.15));
        } else {
          target = 0.04 + 0.02 * Math.abs(Math.sin(t * 0.4 + i * 0.2));
        }

        // Smooth lerp
        barsRef.current[i] =
          barsRef.current[i] * 0.75 + target * 0.25;

        const bh = barsRef.current[i] * H;
        const x = i * (barW + 1.5);
        const y = (H - bh) / 2;

        ctx.fillStyle = grad;
        ctx.beginPath();
        const r = Math.min(barW / 2, 4);
        ctx.roundRect(x, y, barW, bh, r);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, darkMode]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-12"
      style={{ display: 'block' }}
    />
  );
}
