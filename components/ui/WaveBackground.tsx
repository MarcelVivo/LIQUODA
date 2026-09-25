'use client';

import { useEffect, useRef } from 'react';

/**
 * 3D-Netzwelle, übernommen von der Titelfolie der Präsentation.
 * Knoten stehen für Emittenten (hell, grösser) und Investoren (Petrol),
 * verbunden durch ein Wellennetz mit Tiefe. Impulse wandern entlang der Linien.
 * Läuft nur, solange die Fläche sichtbar ist; bei «prefers-reduced-motion»
 * wird ein einzelnes, ruhendes Bild gezeichnet.
 */

const COLS = 56;
const ROWS = 24;
const FOV = 320;
const MODE = { speed: 1.0, fade: 0.62, pulses: 16 };

type Node = { inv: boolean; big: boolean };
type Pulse = { from: { c: number; r: number }; to: { c: number; r: number }; p: number; speed: number };
type Point = [number, number, number, number];

export default function WaveBackground({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0;
    let H = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth;
      H = cv.clientHeight;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const nodes: Node[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const rnd = Math.sin(c * 127.1 + r * 311.7) * 43758.5453;
        const f = rnd - Math.floor(rnd);
        nodes.push({ inv: f > 0.5, big: f > 0.93 });
      }
    }

    const wavePoint = (c: number, r: number, t: number): Point => {
      const z = 46 + r * 42;
      const s = FOV / (FOV + z);
      const wave =
        Math.sin(c * 0.32 + t * 0.0011 + r * 0.45) * 20 +
        Math.cos(r * 0.55 - t * 0.0008 + c * 0.1) * 14;
      const px = W / 2 + (c - (COLS - 1) / 2) * (W / 44) * (0.6 + s);
      const py = H * 0.34 + (355 + wave) * s * (H / 460);
      return [px, py, s, 1 - r / ROWS];
    };

    const spawnPulse = (): Pulse => {
      const alongRow = Math.random() > 0.45;
      const from = { c: Math.floor(Math.random() * COLS), r: Math.floor(Math.random() * ROWS) };
      const dist = 3 + Math.floor(Math.random() * 9);
      const dir = Math.random() > 0.5 ? 1 : -1;
      const to = alongRow
        ? { c: Math.max(0, Math.min(COLS - 1, from.c + dist * dir)), r: from.r }
        : { c: from.c, r: Math.max(0, Math.min(ROWS - 1, from.r + dist * dir)) };
      return { from, to, p: 0, speed: 0.006 + Math.random() * 0.009 };
    };
    const pulses: Pulse[] = [];
    for (let i = 0; i < MODE.pulses; i++) {
      const pl = spawnPulse();
      pl.p = Math.random();
      pulses.push(pl);
    }

    let speed = 0;
    let fade = 0;
    let vt = 0;
    let last: number | null = null;
    let raf = 0;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      if (fade < 0.005) return;
      const F = fade;
      const pts: Point[][] = [];
      for (let r = 0; r < ROWS; r++) {
        pts.push([]);
        for (let c = 0; c < COLS; c++) pts[r].push(wavePoint(c, r, vt));
      }

      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(31,168,140,${0.055 * F})`;
      for (let c = 0; c < COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(pts[ROWS - 1][c][0], pts[ROWS - 1][c][1]);
        for (let r = ROWS - 2; r >= 0; r--) ctx.lineTo(pts[r][c][0], pts[r][c][1]);
        ctx.stroke();
      }

      for (let r = ROWS - 1; r >= 0; r--) {
        const depth = pts[r][0][3];
        ctx.beginPath();
        ctx.moveTo(pts[r][0][0], pts[r][0][1]);
        for (let c = 1; c < COLS; c++) ctx.lineTo(pts[r][c][0], pts[r][c][1]);
        ctx.strokeStyle = `rgba(31,168,140,${(0.028 + depth * 0.075) * F})`;
        ctx.stroke();

        for (let c = 0; c < COLS; c++) {
          const n = nodes[r * COLS + c];
          const [px, py, s] = pts[r][c];
          const pulse = n.big ? 1 + 0.35 * Math.sin(vt * 0.003 + c * 2.1) : 1;
          const base = n.inv ? (n.big ? 2.8 : 1.5) : n.big ? 3.8 : 2.3;
          const rad = base * (0.4 + s) * pulse;
          const a = (0.1 + depth * (n.big ? 0.75 : 0.42)) * F;
          ctx.beginPath();
          ctx.arc(px, py, rad, 0, 6.2832);
          ctx.fillStyle = n.inv ? `rgba(62,209,176,${a})` : `rgba(198,210,219,${a * 0.9})`;
          ctx.fill();
        }
      }

      ctx.shadowColor = 'rgba(62,209,176,0.9)';
      for (let pi = 0; pi < Math.min(MODE.pulses, pulses.length); pi++) {
        const pl = pulses[pi];
        pl.p += pl.speed * speed;
        if (pl.p >= 1) Object.assign(pl, spawnPulse());
        const c = pl.from.c + (pl.to.c - pl.from.c) * pl.p;
        const r = pl.from.r + (pl.to.r - pl.from.r) * pl.p;
        const [px, py, s, depth] = wavePoint(c, r, vt);
        const glow = Math.sin(pl.p * Math.PI);
        ctx.shadowBlur = 10 * s;
        ctx.beginPath();
        ctx.arc(px, py, 2.4 * (0.4 + s), 0, 6.2832);
        ctx.fillStyle = `rgba(120,235,205,${(0.25 + 0.65 * depth * glow) * F})`;
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    };

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      if (last === null) last = t;
      const dt = Math.min(t - last, 50);
      last = t;
      speed += (MODE.speed - speed) * 0.04;
      fade += (MODE.fade - fade) * 0.05;
      vt += dt * speed;
      draw();
    };

    const start = () => {
      if (raf || reduced) return;
      last = null;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) draw();
    });
    ro.observe(cv);

    if (reduced) {
      fade = MODE.fade;
      draw();
    }

    // Nur rechnen, wenn die Fläche im Viewport ist
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) start();
      else stop();
    });
    io.observe(cv);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={['pointer-events-none absolute inset-0 h-full w-full', className].filter(Boolean).join(' ')}
      aria-hidden="true"
    />
  );
}
