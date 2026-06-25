'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';

const FILTER_ID = 'liq-water';

export default function ComingSoon() {
  const t = useTranslations('landing');

  // SVG filter refs
  const turbRef = useRef<SVGFETurbulenceElement>(null);
  const dispRef = useRef<SVGFEDisplacementMapElement>(null);

  // Interaction
  const logoWrapRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const state = useRef({
    hovering: false,
    scale: 5,
    targetScale: 5,
    mx: 0.5, // normalised 0–1 inside logo
    my: 0.5,
  });

  /* ─── Animation loop ─────────────────────────────────────── */
  useEffect(() => {
    const tick = (ts: number) => {
      const s = state.current;
      const t = ts * 0.001; // seconds

      // Lerp displacement scale smoothly
      s.scale += (s.targetScale - s.scale) * (s.hovering ? 0.09 : 0.05);

      if (turbRef.current && dispRef.current) {
        let fx: number, fy: number;

        if (s.hovering) {
          // Faster, mouse-position-biased turbulence — feels like water being pushed
          fx = 0.014 + Math.sin(t * 3.1 + s.mx * Math.PI * 2) * 0.008;
          fy = 0.020 + Math.cos(t * 2.4 + s.my * Math.PI * 2) * 0.008;
        } else {
          // Very slow, gentle wave drift
          fx = 0.005 + Math.sin(t * 0.38) * 0.0025;
          fy = 0.009 + Math.cos(t * 0.29) * 0.002;
        }

        turbRef.current.setAttribute('baseFrequency', `${fx.toFixed(5)} ${fy.toFixed(5)}`);
        dispRef.current.setAttribute('scale', s.scale.toFixed(2));
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  /* ─── Mouse handlers ─────────────────────────────────────── */
  const onEnter = useCallback(() => {
    state.current.hovering = true;
    state.current.targetScale = 26;
    if (highlightRef.current) highlightRef.current.style.opacity = '1';
  }, []);

  const onLeave = useCallback(() => {
    state.current.hovering = false;
    state.current.targetScale = 5;
    if (highlightRef.current) highlightRef.current.style.opacity = '0';
  }, []);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = logoWrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = (e.clientX - rect.left) / rect.width;
    const my = (e.clientY - rect.top) / rect.height;
    state.current.mx = mx;
    state.current.my = my;

    // Move a soft radial highlight with the cursor — simulates light caustics on water
    if (highlightRef.current) {
      highlightRef.current.style.background = `radial-gradient(ellipse 55% 45% at ${mx * 100}% ${my * 100}%, rgba(110, 210, 240, 0.22) 0%, transparent 70%)`;
    }
  }, []);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0b1830] select-none">

      {/* ── Ambient background glow ──────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[60vh] w-[80vw] rounded-full"
        style={{
          background: 'radial-gradient(ellipse, rgba(79, 195, 232, 0.07) 0%, transparent 65%)',
        }}
      />

      {/* ── SVG filter (off-screen, no dimensions) ───────────── */}
      <svg
        aria-hidden="true"
        focusable="false"
        width="0"
        height="0"
        className="absolute overflow-hidden"
      >
        <defs>
          {/*
           * feTurbulence generates the "liquid" noise map.
           * feDisplacementMap warps SourceGraphic pixels using R→X, G→Y channels.
           * baseFrequency and scale are driven in JS via the RAF loop above.
           */}
          <filter id={FILTER_ID} x="-15%" y="-40%" width="130%" height="180%" colorInterpolationFilters="sRGB">
            <feTurbulence
              ref={turbRef}
              type="turbulence"
              baseFrequency="0.005 0.009"
              numOctaves="5"
              seed="12"
              result="noise"
            />
            <feDisplacementMap
              ref={dispRef}
              in="SourceGraphic"
              in2="noise"
              scale="5"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* ── Logo block ────────────────────────────────────────── */}
      <div
        ref={logoWrapRef}
        className="relative cursor-default"
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onMouseMove={onMove}
      >
        {/* Filtered (distorted) logo */}
        <div style={{ filter: `url(#${FILTER_ID})` }}>
          <h1
            aria-label="LIQUODA"
            className="font-black leading-none tracking-tight liq-logo-text"
          >
            LIQUODA
          </h1>
        </div>

        {/* Caustic highlight overlay — follows mouse, not filtered */}
        <div
          ref={highlightRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-[-12%] opacity-0 rounded-2xl"
          style={{ transition: 'opacity 0.4s ease' }}
        />
      </div>

      {/* ── Slogan ───────────────────────────────────────────── */}
      <p className="mt-7 text-xs sm:text-sm font-medium tracking-[0.35em] uppercase text-white/40">
        {t('slogan')}
      </p>

      {/* ── Coming soon ──────────────────────────────────────── */}
      <p className="mt-2 text-[10px] sm:text-xs tracking-[0.5em] uppercase text-white/20 font-light">
        {t('comingSoon')}
      </p>

      {/* ── Buttons (decorative, no function) ────────────────── */}
      <div className="mt-10 flex flex-col sm:flex-row items-center gap-3">
        <button
          tabIndex={-1}
          aria-disabled="true"
          className="liq-btn-outline"
        >
          {t('ctaList')}
        </button>
        <button
          tabIndex={-1}
          aria-disabled="true"
          className="liq-btn-filled"
        >
          {t('ctaInvest')}
        </button>
      </div>
    </main>
  );
}
