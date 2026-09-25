'use client';

import { useEffect, useId, useRef } from 'react';

type Size = 'sm' | 'md' | 'lg' | 'hero';

const sizeClasses: Record<Size, string> = {
  sm: 'w-[120px]',
  md: 'w-[150px]',
  lg: 'w-[220px]',
  hero: 'w-[clamp(280px,42vw,540px)]',
};

/**
 * Schriftzug «Liquoda.-» als SVG, übernommen aus der Präsentation:
 * «Liquoda» in Georgia und currentColor, «.-» in Petrol mit Schimmer.
 * Mit `liquid` verflüssigt sich das «.-» in zufälligen Abständen kurz
 * (feTurbulence + feDisplacementMap) und kehrt zurück.
 */
export default function Wordmark({
  size = 'md',
  liquid = false,
  className = '',
}: {
  size?: Size;
  liquid?: boolean;
  className?: string;
}) {
  const filterId = `liq-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const turbRef = useRef<SVGFETurbulenceElement>(null);
  const dispRef = useRef<SVGFEDisplacementMapElement>(null);

  useEffect(() => {
    if (!liquid) return;
    const turb = turbRef.current;
    const disp = dispRef.current;
    if (!turb || !disp) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let timer = 0;
    let raf = 0;
    let stopped = false;

    const schedule = () => {
      timer = window.setTimeout(run, 2500 + Math.random() * 5500);
    };
    const run = () => {
      const dur = 2400;
      const t0 = performance.now();
      const tick = (t: number) => {
        if (stopped) return;
        const p = Math.min(1, (t - t0) / dur);
        const env = Math.sin(p * Math.PI);
        disp.setAttribute('scale', (26 * env).toFixed(2));
        turb.setAttribute(
          'baseFrequency',
          `${(0.015 + 0.006 * Math.sin(t / 150)).toFixed(4)} ${(0.06 + 0.02 * Math.sin(t / 210)).toFixed(4)}`
        );
        if (p < 1) raf = requestAnimationFrame(tick);
        else {
          disp.setAttribute('scale', '0');
          schedule();
        }
      };
      raf = requestAnimationFrame(tick);
    };
    schedule();

    return () => {
      stopped = true;
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [liquid]);

  return (
    <svg
      viewBox="0 0 310 80"
      className={['block h-auto overflow-visible', sizeClasses[size], className].filter(Boolean).join(' ')}
      role="img"
      aria-label="Liquoda"
    >
      {liquid && (
        <defs>
          <filter id={filterId} x="-30%" y="-60%" width="160%" height="220%">
            <feTurbulence
              ref={turbRef}
              type="fractalNoise"
              baseFrequency="0.015 0.06"
              numOctaves={2}
              result="n"
            />
            <feDisplacementMap
              ref={dispRef}
              in="SourceGraphic"
              in2="n"
              scale={0}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      )}
      <text
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="64"
        fontWeight="400"
        letterSpacing="2"
        dominantBaseline="middle"
        textAnchor="end"
        x="250"
        y="42"
        fill="currentColor"
      >
        Liquoda
      </text>
      <text
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="64"
        fontWeight="700"
        letterSpacing="0"
        dominantBaseline="middle"
        textAnchor="start"
        x="252"
        y="42"
        className="liq-ld"
        filter={liquid ? `url(#${filterId})` : undefined}
      >
        .-
      </text>
    </svg>
  );
}
