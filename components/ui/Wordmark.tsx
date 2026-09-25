type Size = 'sm' | 'md' | 'lg' | 'xl';

const sizeClasses: Record<Size, string> = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-4xl sm:text-5xl',
  xl: 'text-5xl sm:text-6xl lg:text-7xl',
};

/**
 * Schriftzug «Liquoda.-» in Serifenschrift (Spec, Abschnitt 2).
 * Das Logo-SVG (public/liquoda-logo-v2.svg) ist weiss und für dunkle
 * Hintergründe gedacht; auf Creme wird der Schriftzug als Text gesetzt.
 */
export default function Wordmark({
  size = 'md',
  className = '',
}: {
  size?: Size;
  className?: string;
}) {
  return (
    <span className={['liq-wordmark', sizeClasses[size], className].filter(Boolean).join(' ')}>
      Liquoda<span className="liq-wordmark-accent">.-</span>
    </span>
  );
}
