import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import QuestionForm from '@/components/community/QuestionForm';
import { formatDate } from '@/lib/format';
import { listProjectQuestions, listProjectUpdates } from '@/lib/community';

/** Öffentlich auf der Projektseite: Neuigkeiten und beantwortete Fragen, Frageformular für Investoren. */
export default async function ProjectCommunity({
  projectId,
  projectOpen,
  viewerRole,
}: {
  projectId: string;
  projectOpen: boolean;
  viewerRole: 'investor' | 'emittent' | 'admin' | null;
}) {
  const t = await getTranslations('community');
  const locale = (await getLocale()) as 'de' | 'en';
  const [updates, questions] = await Promise.all([listProjectUpdates(projectId), listProjectQuestions(projectId)]);
  const answered = questions.filter((q) => q.answer);

  return (
    <>
      <div id="neuigkeiten">
        <h2 className="text-xl font-extrabold tracking-tight text-navy">{t('updates.title')}</h2>
        {updates.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{t('updates.empty')}</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {updates.map((u) => (
              <li key={u.id} className="liq-card p-5">
                <p className="text-xs text-muted">{t('updates.by')} · {formatDate(u.created_at.slice(0, 10), locale)}</p>
                <h3 className="mt-1 text-base font-bold text-navy">{u.title[locale] || u.title.de}</h3>
                {(((u.body as unknown as Record<string, string[]>)[locale] ?? (u.body as unknown as Record<string, string[]>).de) ?? []).map((p, i) => (
                  <p key={i} className="mt-2 text-sm leading-relaxed text-body">{p}</p>
                ))}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div id="fragen">
        <h2 className="text-xl font-extrabold tracking-tight text-navy">{t('questions.title')}</h2>
        <p className="mt-2 text-sm text-muted">{t('questions.lead')}</p>
        {answered.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{t('questions.empty')}</p>
        ) : (
          <ul className="mt-4 divide-y divide-navy/10 rounded-2xl bg-white shadow-card">
            {answered.map((q) => (
              <li key={q.id} className="px-5 py-4">
                <p className="text-xs text-muted">{t('questions.investor')} · {formatDate(q.created_at.slice(0, 10), locale)}</p>
                <p className="mt-1 text-sm font-semibold text-navy">{q.question}</p>
                <p className="mt-2 text-xs text-muted">{t('questions.emittent')} · {q.answered_at ? formatDate(q.answered_at.slice(0, 10), locale) : ''}</p>
                <p className="mt-1 text-sm leading-relaxed text-body">{q.answer}</p>
              </li>
            ))}
          </ul>
        )}
        <div className="liq-card mt-6 p-6">
          {viewerRole === 'investor' && projectOpen ? (
            <QuestionForm projectId={projectId} />
          ) : !projectOpen ? (
            <p className="text-sm text-muted">{t('questions.onlyOpen')}</p>
          ) : viewerRole ? (
            <p className="text-sm text-muted">{t('questions.loginToAsk')}</p>
          ) : (
            <p className="text-sm text-muted">
              <Link href="/login" className="liq-link font-semibold text-navy">{t('questions.loginToAsk')}</Link>
            </p>
          )}
        </div>
      </div>
    </>
  );
}
