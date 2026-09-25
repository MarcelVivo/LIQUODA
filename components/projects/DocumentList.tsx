import { useLocale, useTranslations } from 'next-intl';
import { FileText } from 'lucide-react';
import { formatDate } from '@/lib/format';
import type { Locale, ProjectDocument } from '@/lib/projects';

export default function DocumentList({ documents }: { documents: ProjectDocument[] }) {
  const locale = useLocale() as Locale;
  const t = useTranslations('projects.detail');

  return (
    <div>
      <ul className="divide-y divide-navy/10 overflow-hidden rounded-2xl bg-white shadow-card">
        {documents.map((doc) => (
          <li key={doc.id} className="flex items-start gap-4 px-5 py-4">
            <FileText size={20} className="mt-0.5 shrink-0 text-accent" strokeWidth={1.5} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-navy">{doc.title[locale]}</p>
              <p className="mt-0.5 text-xs text-muted">
                {t(`docTypes.${doc.type}`)} · {t('version', { version: doc.version })} ·{' '}
                {formatDate(doc.date, locale)}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">{t('documentsNote')}</p>
    </div>
  );
}
