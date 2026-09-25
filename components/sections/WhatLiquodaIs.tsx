import { useTranslations } from 'next-intl';
import { Check, Minus } from 'lucide-react';
import Section, { SectionHeading } from '@/components/ui/Section';

export default function WhatLiquodaIs() {
  const t = useTranslations('home.whatIs');
  const isItems = t.raw('isItems') as string[];
  const isNotItems = t.raw('isNotItems') as string[];

  return (
    <Section id="was-liquoda-ist" tone="white" ariaLabel={t('title')}>
      <SectionHeading title={t('title')} lead={t('lead')} />

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="liq-card p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-navy">{t('isTitle')}</h3>
          <ul className="mt-4 space-y-3">
            {isItems.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted">
                <Check size={18} className="mt-0.5 shrink-0 text-accent-start" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="liq-card p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-navy">{t('isNotTitle')}</h3>
          <ul className="mt-4 space-y-3">
            {isNotItems.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted">
                <Minus size={18} className="mt-0.5 shrink-0 text-muted/70" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <blockquote className="mt-10 max-w-3xl border-l-2 border-navy pl-5 text-base leading-relaxed text-navy sm:text-lg">
        {t('principle')}
      </blockquote>
    </Section>
  );
}
