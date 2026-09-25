import { useLocale, useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
import type { Locale, Localized } from '@/lib/projects';

/** Abschnitt «Risiken und Hinweise» (Spec, Abschnitt 3): allgemeine und projektspezifische Risiken. */
export default function RiskNotes({ projectRisks }: { projectRisks: Localized[] }) {
  const locale = useLocale() as Locale;
  const t = useTranslations('projects.detail');
  const general = t.raw('generalRisks') as string[];

  return (
    <div className="liq-card border-l-4 border-accent p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <AlertTriangle size={22} className="shrink-0 text-accent" strokeWidth={1.5} aria-hidden="true" />
        <h2 className="text-xl font-extrabold tracking-tight text-navy">{t('risks')}</h2>
      </div>
      <p className="mt-2 text-sm text-muted">{t('risksLead')}</p>

      <h3 className="mt-6 text-sm font-bold uppercase tracking-[0.16em] text-accent">{t('generalRisksTitle')}</h3>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-body">
        {general.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      {projectRisks.length > 0 && (
        <>
          <h3 className="mt-6 text-sm font-bold uppercase tracking-[0.16em] text-accent">{t('projectRisksTitle')}</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-body">
            {projectRisks.map((item) => (
              <li key={item[locale]}>{item[locale]}</li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-6 border-t border-navy/10 pt-4 text-xs text-muted">{t('roleNote')}</p>
    </div>
  );
}
