import type { ReactNode } from 'react';

type Tone = 'cream' | 'white' | 'navy';

// Helle Sektionen liegen transparent auf dem Seitenverlauf (wie die hellen
// Folien), «white» setzt ein leichtes Band ab, «navy» ist die dunkle Ink-Fläche.
const toneClasses: Record<Tone, string> = {
  cream: 'bg-transparent text-body',
  white: 'bg-white/50 text-body',
  navy: 'liq-ink',
};

export default function Section({
  id,
  tone = 'cream',
  className = '',
  children,
  ariaLabel,
}: {
  id?: string;
  tone?: Tone;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}) {
  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={[toneClasses[tone], 'relative py-16 sm:py-20', className].filter(Boolean).join(' ')}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

export function SectionHeading({
  title,
  lead,
  kicker,
  align = 'left',
  as: Tag = 'h2',
}: {
  title: string;
  lead?: string;
  kicker?: string;
  align?: 'left' | 'center';
  as?: 'h1' | 'h2';
}) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      {kicker ? (
        <p className="liq-kicker mb-4">{kicker}</p>
      ) : (
        <div className={['liq-accent-line mb-5', align === 'center' ? 'mx-auto' : ''].join(' ')} />
      )}
      <Tag
        className={[
          'font-extrabold tracking-tight text-inherit',
          Tag === 'h1' ? 'text-3xl sm:text-4xl lg:text-5xl' : 'text-2xl sm:text-3xl lg:text-[2.2rem]',
        ].join(' ')}
      >
        {title}
      </Tag>
      {lead && <p className="mt-4 text-base leading-relaxed opacity-80 sm:text-lg">{lead}</p>}
    </div>
  );
}
