import type { ReactNode } from 'react';

type Tone = 'cream' | 'white' | 'navy';

const toneClasses: Record<Tone, string> = {
  cream: 'bg-cream text-navy',
  white: 'bg-white text-navy',
  navy: 'bg-navy text-cream',
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
      className={[toneClasses[tone], 'py-16 sm:py-20', className].filter(Boolean).join(' ')}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

export function SectionHeading({
  title,
  lead,
  align = 'left',
  as: Tag = 'h2',
}: {
  title: string;
  lead?: string;
  align?: 'left' | 'center';
  as?: 'h1' | 'h2';
}) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <div className={['liq-accent-line mb-5', align === 'center' ? 'mx-auto' : ''].join(' ')} />
      <Tag
        className={
          Tag === 'h1'
            ? 'text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl'
            : 'text-2xl font-semibold tracking-tight sm:text-3xl'
        }
      >
        {title}
      </Tag>
      {lead && <p className="mt-4 text-base leading-relaxed opacity-80 sm:text-lg">{lead}</p>}
    </div>
  );
}
