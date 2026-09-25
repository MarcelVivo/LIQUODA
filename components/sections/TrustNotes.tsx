import { useTranslations } from 'next-intl';
import Section, { SectionHeading } from '@/components/ui/Section';

type Item = { title: string; text: string };

/**
 * Pflichtinhalte gemäss Spec, Abschnitt 2: Rolle von LIQUODA,
 * unternehmerisches Risiko, keine Garantie, transparenter Ablauf,
 * Konsequenzen bei Abbruch oder Scheitern.
 */
export default function TrustNotes() {
  const t = useTranslations('home.trust');
  const items = t.raw('items') as Item[];

  return (
    <Section id="hinweise" tone="navy" ariaLabel={t('title')}>
      <SectionHeading title={t('title')} />
      <dl className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.title} className="border-t border-white/10 pt-5">
            <dt className="text-base font-semibold text-onink">{item.title}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-onink-muted">{item.text}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
