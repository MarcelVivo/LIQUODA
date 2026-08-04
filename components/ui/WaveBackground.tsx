'use client';

import { useEffect, useRef } from 'react';

type Point = {
  x: number;
  y: number;
  alpha: number;
  accent: boolean;
};

const hash = (x: number, y: number) => {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return value - Math.floor(value);
};

export default function WaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    let frame = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    const startedAt = performance.now();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now: number) => {
      context.clearRect(0, 0, width, height);

      const time = reduceMotion ? 0 : (now - startedAt) * 0.00016;
      const columns = width < 640 ? 34 : 58;
      const rows = height > 1050 ? 42 : 34;
      const horizon = Math.min(height * 0.48, 570);
      const fieldDepth = Math.max(height - horizon, height * 0.55);
      const points: Point[][] = [];

      for (let row = 0; row < rows; row += 1) {
        const depth = row / (rows - 1);
        const perspective = Math.pow(depth, 1.55);
        const spread = 0.7 + depth * 0.72;
        const line: Point[] = [];

        for (let column = 0; column < columns; column += 1) {
          const across = column / (columns - 1);
          const signedX = across * 2 - 1;
          const wave =
            Math.sin(signedX * 5.2 + time * 2.1 + depth * 1.9) * 0.52 +
            Math.sin(signedX * 10.4 - time * 1.15 + depth * 4.6) * 0.22 +
            Math.cos(depth * 7.1 - time * 1.5 + signedX * 2.2) * 0.26;
          const edgeLift = Math.abs(signedX) * depth * 0.035;
          const amplitude = height * (0.022 + depth * 0.07);

          line.push({
            x: width * 0.5 + signedX * width * 0.5 * spread + wave * depth * 7,
            y: horizon + perspective * fieldDepth + wave * amplitude - edgeLift * height,
            alpha: 0.16 + depth * 0.24,
            accent: hash(column, row) > 0.925,
          });
        }

        points.push(line);
      }

      context.lineWidth = 0.65;
      context.strokeStyle = 'rgba(39, 143, 155, 0.15)';

      for (let row = 0; row < rows; row += 1) {
        context.beginPath();
        points[row].forEach((point, column) => {
          if (column === 0) context.moveTo(point.x, point.y);
          else context.lineTo(point.x, point.y);
        });
        context.stroke();
      }

      for (let column = 0; column < columns; column += 1) {
        context.beginPath();
        points.forEach((line, row) => {
          const point = line[column];
          if (row === 0) context.moveTo(point.x, point.y);
          else context.lineTo(point.x, point.y);
        });
        context.stroke();
      }

      points.forEach((line, row) => {
        line.forEach((point, column) => {
          const twinkle = 0.72 + Math.sin(time * 8 + row * 0.8 + column * 1.3) * 0.28;
          const radius = point.accent ? 1.45 + twinkle * 0.8 : 0.65 + (row / rows) * 0.35;
          context.beginPath();
          context.arc(point.x, point.y, radius, 0, Math.PI * 2);
          context.fillStyle = point.accent
            ? `rgba(25, 196, 163, ${0.5 + twinkle * 0.34})`
            : `rgba(75, 163, 175, ${point.alpha * twinkle})`;
          context.fill();
        });
      });

      if (!reduceMotion) frame = requestAnimationFrame(draw);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    draw(startedAt);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="liquoda-ambient-glow absolute inset-0" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="liquoda-wave-fade absolute inset-0" />
    </div>
  );
}
