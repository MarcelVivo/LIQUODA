import { useTranslations } from 'next-intl';
import { Info } from 'lucide-react';
import Section, { SectionHeading } from '@/components/ui/Section';

export type LegalKey = 'impressum' | 'datenschutz' | 'agb' | 'risiken' | 'haftung';

type LegalSection = { title: string; items: string[] };

/**
 * Rechtliche Seiten als Platzhalter (Etappe 1). Inhalte kommen aus
 * messages/*.json unter «legal.<key>» und werden vor dem Start ergänzt.
 */
export default function LegalPage({ legalKey }: { legalKey: LegalKey }) {
  const t = useTranslations(`legal.${legalKey}`);
  const tCommon = useTranslations('common');
  const sections = t.raw('sections') as LegalSection[];

  return (
    <Section className="pt-28 sm:pt-32" ariaLabel={t('title')}>
      <SectionHeading as="h1" title={t('title')} lead={t('lead')} />

      <div className="mt-8 flex max-w-3xl gap-3 rounded-lg border border-navy/15 bg-white px-4 py-3 text-sm text-muted">
        <Info size={18} className="mt-0.5 shrink-0 text-navy" aria-hidden="true" />
        <p>
          <span className="font-semibold text-navy">{tCommon('placeholderTitle')}: </span>
          {tCommon('placeholderText')}
        </p>
      </div>

      <div className="mt-10 max-w-3xl space-y-10">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-lg font-semibold text-navy">{section.title}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
