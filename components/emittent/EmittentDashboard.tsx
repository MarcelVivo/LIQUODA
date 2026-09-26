import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import Badge from '@/components/ui/Badge';
import Section, { SectionHeading } from '@/components/ui/Section';
import LogoutButton from '@/components/auth/LogoutButton';
import NewProjectButton from '@/components/emittent/NewProjectButton';
import { listOwnProjects, type OwnProject } from '@/lib/emittent';
import { formatChf, formatDate } from '@/lib/format';
import type { Account } from '@/lib/supabase/server';

const statusVariant: Record<OwnProject['status'], 'active' | 'info' | 'neutral'> = {
  draft: 'neutral',
  in_review: 'info',
  approved: 'info',
  active: 'active',
  funded: 'active',
  failed: 'neutral',
  cancelled: 'neutral',
  closed: 'neutral',
};

const PUBLIC = ['active', 'funded', 'failed', 'cancelled', 'closed'];

export default async function EmittentDashboard({ account }: { account: Account }) {
  const t = await getTranslations('emittent.dashboard');
  const tAccount = await getTranslations('auth.account');
  const locale = (await getLocale()) as 'de' | 'en';
  const projects = await listOwnProjects();

  return (
    <Section className="pt-28 sm:pt-32">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeading as="h1" title={t('title')} lead={t('lead')} />
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted sm:inline">{account.email}</span>
          <LogoutButton />
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-accent">{t('projects')}</h2>
        <NewProjectButton />
      </div>

      {projects.length === 0 ? (
        <p className="liq-card mt-4 p-8 text-sm text-muted">{t('empty')}</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {projects.map((p) => (
            <li key={p.id} className="liq-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge label={t(`statuses.${p.status}`)} variant={statusVariant[p.status]} />
                    <span className="text-xs text-muted">
                      {t('updated')}: {formatDate(p.updated_at.slice(0, 10), locale)}
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-bold text-navy">{p.title[locale] || p.title.de}</h3>
                  <p className="mt-1 text-sm text-muted">{t(`statusHints.${p.status}`)}</p>
                  {p.review_note && (
                    <p className="mt-3 rounded-lg border-l-4 border-accent bg-cream px-3 py-2 text-sm text-body">
                      <span className="font-semibold text-navy">{t('reviewNote')}: </span>
                      {p.review_note}
                    </p>
                  )}
                </div>
                <dl className="grid shrink-0 grid-cols-3 gap-4 text-xs">
                  <div>
                    <dt className="text-muted">{t('target')}</dt>
                    <dd className="font-semibold text-navy">{formatChf(Number(p.target_amount_chf))}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">{t('raised')}</dt>
                    <dd className="font-semibold text-navy">{formatChf(Number(p.raised_amount_chf))}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">{t('deadline')}</dt>
                    <dd className="font-semibold text-navy">{formatDate(p.deadline, locale)}</dd>
                  </div>
                </dl>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <Link href={`/emittent/projekte/${p.id}`} className="liq-link font-semibold text-navy">
                  {p.status === 'draft' ? t('edit') : t('open')}
                </Link>
                {PUBLIC.includes(p.status) && (
                  <Link href={`/projekte/${p.slug}`} className="liq-link text-muted">
                    {t('view')}
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 text-xs text-muted">
        {tAccount('kyc')}: {tAccount('kycHint')}
      </p>
    </Section>
  );
}
