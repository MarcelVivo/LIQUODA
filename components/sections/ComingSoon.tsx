'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';

const FILTER_ID = 'liq-water';

// Tech + finance symbols flowing through the liquid
const SYMBOLS = [
  // Technical / code
  '0x', '{}', '[]', '<>', '//', '::', '&&', '||', '→', '≡',
  'λ', '∂', '∇', '⊕', '01', '10', 'A3', 'F7', '2D', '#4F',
  '0xFF', '0x1A', 'B7E', 'C9D', '≠', '=>',
  // Finance / markets
  '$', '€', '£', '¥', '%', '±', '≈', '▲', '▼', '∞',
  'CHF', 'ETH', '₿', 'APY', 'TVL', 'NAV',
  '+3.2', '1.4%', '4.8%', '-0.7', 'Σ', 'Δ',
];

const COLORS = ['#c4e9f9', '#9dd8f2', '#7dd3f0', '#aee0f7', '#6dcde8'];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  symbol: string;
  opacity: number;
  size: number;
  phase: number;
  color: string;
}

function spawnParticles(count: number, W: number, H: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.14,
    vy: (Math.random() - 0.5) * 0.07,
    symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    opacity: Math.random() * 0.09 + 0.025,
    size: Math.floor(Math.random() * 5) + 9,
    phase: Math.random() * Math.PI * 2,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));
}

export default function ComingSoon() {
  const t = useTranslations('landing');

  const turbRef = useRef<SVGFETurbulenceElement>(null);
  const dispRef = useRef<SVGFEDisplacementMapElement>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const dimsRef = useRef({ W: 0, H: 0 });

  const logoWrapRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const state = useRef({
    hovering: false,
    scale: 3,
    targetScale: 3,
    mx: 0.5,
    my: 0.5,
  });

  // Set up canvas size and initial particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const init = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
      dimsRef.current = { W, H };
      const count = Math.max(45, Math.min(90, Math.floor((W * H) / 14000)));
      particlesRef.current = spawnParticles(count, W, H);
    };

    init();
    window.addEventListener('resize', init);
    return () => window.removeEventListener('resize', init);
  }, []);

  /* ─── Unified animation loop ────────────────────────────────── */
  useEffect(() => {
    const tick = (ts: number) => {
      const s = state.current;
      const time = ts * 0.001;

      // Very slow lerp toward target scale
      s.scale += (s.targetScale - s.scale) * (s.hovering ? 0.05 : 0.022);

      // Update SVG water distortion
      if (turbRef.current && dispRef.current) {
        let fx: number, fy: number;

        if (s.hovering) {
          // Gently responds to mouse — still calm, not violent
          fx = 0.006 + Math.sin(time * 0.9 + s.mx * Math.PI * 2) * 0.0025;
          fy = 0.009 + Math.cos(time * 0.7 + s.my * Math.PI * 2) * 0.0025;
        } else {
          // Ultra-slow drift — barely perceptible, like deep water
          fx = 0.003 + Math.sin(time * 0.12) * 0.0008;
          fy = 0.005 + Math.cos(time * 0.09) * 0.001;
        }

        turbRef.current.setAttribute('baseFrequency', `${fx.toFixed(6)} ${fy.toFixed(6)}`);
        dispRef.current.setAttribute('scale', s.scale.toFixed(2));
      }

      // Draw particles
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && canvas) {
        const { W, H } = dimsRef.current;
        ctx.clearRect(0, 0, W, H);

        particlesRef.current.forEach(p => {
          // Gentle sinusoidal drift — simulates liquid current
          const wx = Math.sin(time * 0.16 + p.phase) * 0.09;
          const wy = Math.cos(time * 0.12 + p.phase * 1.3) * 0.06;

          p.x += p.vx + wx;
          p.y += p.vy + wy;

          if (p.x < -70) p.x = W + 70;
          if (p.x > W + 70) p.x = -70;
          if (p.y < -40) p.y = H + 40;
          if (p.y > H + 40) p.y = -40;

          ctx.save();
          ctx.globalAlpha = p.opacity;
          ctx.font = `${p.size}px "Courier New", "Lucida Console", monospace`;
          ctx.fillStyle = p.color;
          ctx.fillText(p.symbol, p.x, p.y);
          ctx.restore();
        });
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  /* ─── Mouse handlers ─────────────────────────────────────────── */
  const onEnter = useCallback(() => {
    state.current.hovering = true;
    state.current.targetScale = 13;
    if (highlightRef.current) highlightRef.current.style.opacity = '1';
  }, []);

  const onLeave = useCallback(() => {
    state.current.hovering = false;
    state.current.targetScale = 3;
    if (highlightRef.current) highlightRef.current.style.opacity = '0';
  }, []);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = logoWrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = (e.clientX - rect.left) / rect.width;
    const my = (e.clientY - rect.top) / rect.height;
    state.current.mx = mx;
    state.current.my = my;

    if (highlightRef.current) {
      highlightRef.current.style.background = `radial-gradient(ellipse 55% 45% at ${mx * 100}% ${my * 100}%, rgba(110, 210, 240, 0.16) 0%, transparent 70%)`;
    }
  }, []);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0b1830] select-none">

      {/* Particle canvas — full screen, behind everything */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
      />

      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[60vh] w-[80vw] rounded-full z-10"
        style={{
          background: 'radial-gradient(ellipse, rgba(79, 195, 232, 0.06) 0%, transparent 65%)',
        }}
      />

      {/* SVG water filter definition */}
      <svg
        aria-hidden="true"
        focusable="false"
        width="0"
        height="0"
        className="absolute overflow-hidden"
      >
        <defs>
          {/*
           * fractalNoise gives smoother, more organic undulations than turbulence.
           * 3 octaves keeps it broad and calm — no harsh high-frequency jitter.
           * Low baseFrequency and small scale = barely-there, glassy-water look.
           */}
          <filter id={FILTER_ID} x="-15%" y="-40%" width="130%" height="180%" colorInterpolationFilters="sRGB">
            <feTurbulence
              ref={turbRef}
              type="fractalNoise"
              baseFrequency="0.003 0.005"
              numOctaves="3"
              seed="8"
              result="noise"
            />
            <feDisplacementMap
              ref={dispRef}
              in="SourceGraphic"
              in2="noise"
              scale="3"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Logo block */}
      <div
        ref={logoWrapRef}
        className="relative z-20 cursor-default"
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onMouseMove={onMove}
      >
        <div style={{ filter: `url(#${FILTER_ID})` }}>
          <h1
            aria-label="LIQUODA"
            className="leading-none liq-logo-text"
          >
            LIQUODA
          </h1>
        </div>

        {/* Light caustic overlay — follows mouse */}
        <div
          ref={highlightRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-[-12%] opacity-0 rounded-2xl"
          style={{ transition: 'opacity 0.7s ease' }}
        />
      </div>

      {/* Slogan */}
      <p className="relative z-20 mt-8 text-xs sm:text-sm font-medium tracking-[0.35em] uppercase text-white/40">
        {t('slogan')}
      </p>

      {/* Coming soon */}
      <p className="relative z-20 mt-2 text-[10px] sm:text-xs tracking-[0.5em] uppercase text-white/20 font-light">
        {t('comingSoon')}
      </p>

      {/* Decorative buttons */}
      <div className="relative z-20 mt-10 flex flex-col sm:flex-row items-center gap-3">
        <button tabIndex={-1} aria-disabled="true" className="liq-btn-outline">
          {t('ctaList')}
        </button>
        <button tabIndex={-1} aria-disabled="true" className="liq-btn-filled">
          {t('ctaInvest')}
        </button>
      </div>
    </main>
  );
}
