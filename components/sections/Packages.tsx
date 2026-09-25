import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import Section, { SectionHeading } from '@/components/ui/Section';

const packageKeys = ['basic', 'standard', 'premium'] as const;

/** Pakete und Gebühren gemäss Spec, Abschnitt 10. */
export default function Packages() {
  const t = useTranslations('issuers');

  return (
    <Section id="pakete" tone="white" ariaLabel={t('packagesTitle')}>
      <SectionHeading title={t('packagesTitle')} lead={t('packagesLead')} />

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {packageKeys.map((key, index) => {
          const features = t.raw(`packages.${key}.features`) as string[];
          const previous = index > 0 ? t(`packages.${packageKeys[index - 1]}.name`) : null;
          return (
            <article key={key} className="flex flex-col liq-card liq-card-hover p-6 sm:p-8">
              <h3 className="text-xl font-semibold text-navy">{t(`packages.${key}.name`)}</h3>

              <dl className="mt-5 space-y-3 border-b border-navy/10 pb-5">
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted">{t('setupFee')}</dt>
                  <dd className="text-2xl font-semibold text-navy">{t(`packages.${key}.setup`)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted">{t('monthlyFee')}</dt>
                  <dd className="text-lg font-semibold text-navy">{t(`packages.${key}.monthly`)}</dd>
                </div>
              </dl>

              <p className="mt-5 text-xs font-medium uppercase tracking-wider text-muted">
                {previous ? t('includesPrevious', { name: previous }) : t('includes')}
              </p>
              <ul className="mt-3 space-y-2">
                {features.map((feature) => (
                  <li key={feature} className="flex gap-2.5 text-sm leading-relaxed text-muted">
                    <Check size={16} className="mt-1 shrink-0 text-accent-start" aria-hidden="true" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>

      <div className="mt-10 max-w-3xl liq-card p-6">
        <h3 className="text-base font-semibold text-navy">{t('feesTitle')}</h3>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
          <li>{t('feesIssuer')}</li>
          <li>{t('feesInvestor')}</li>
          <li>{t('feesNone')}</li>
        </ul>
      </div>
    </Section>
  );
}
