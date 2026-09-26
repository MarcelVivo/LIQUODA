import { getTranslations } from 'next-intl/server';
import Badge from '@/components/ui/Badge';
import Section, { SectionHeading } from '@/components/ui/Section';
import LogoutButton from '@/components/auth/LogoutButton';
import { Link } from '@/i18n/routing';
import { createSupabaseServerClient, type Account } from '@/lib/supabase/server';
import { listOwnInvestments } from '@/lib/investments';
import { formatChf, formatDate } from '@/lib/format';

type Profile = {
  name: string;
  email: string;
  role: 'investor' | 'emittent' | 'admin';
  kyc_status: 'pending' | 'approved' | 'rejected';
  wallet_address: string | null;
};

const kycVariant = { pending: 'neutral', approved: 'active', rejected: 'info' } as const;
const publicStatusOf = (status: string) => (status === 'active' ? 'open' : status === 'funded' ? 'funded' : 'closed');
const investmentVariant = { reserved: 'neutral', paid: 'active', confirmed: 'active', cancelled: 'neutral', refunded: 'info' } as const;

/**
 * Schlanke Konto-Seite für Investoren und Emittenten (Etappe 3).
 * Der volle Ausbau von Portfolio und Emittenten-Dashboard folgt in Etappe 5.
 */
export default async function AccountOverview({
  account,
  variant,
}: {
  account: Account;
  variant: 'investor' | 'emittent';
}) {
  const t = await getTranslations('auth.account');
  const tProjects = await getTranslations('projects');
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from('users')
    .select('name, email, role, kyc_status, wallet_address')
    .eq('auth_id', account.authId)
    .maybeSingle();
  const profile = data as Profile | null;
  const nextSteps = t.raw(variant === 'emittent' ? 'nextIssuer' : 'nextInvestor') as string[];
  const investments = variant === 'investor' ? await listOwnInvestments() : [];
  const locale = account.locale;

  return (
    <Section className="pt-28 sm:pt-32">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeading
          as="h1"
          title={t(variant === 'emittent' ? 'issuerTitle' : 'portfolioTitle')}
          lead={t(variant === 'emittent' ? 'issuerLead' : 'portfolioLead')}
        />
        <LogoutButton />
      </div>

      {variant === 'investor' && (
        <div className="liq-card mt-10 p-6 sm:p-8">
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-accent">{t('investmentsTitle')}</h2>
          {investments.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              {t('investmentsEmpty')}{' '}
              <Link href="/projekte" className="liq-link font-semibold text-navy">
                {t('investmentsProjects')}
              </Link>
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-navy/10">
              {investments.map((inv) => {
                const docs = (inv.project?.documents ?? []).filter((d) => !d.investment_id);
                const pay = inv.payment_references?.[0];
                return (
                  <li key={inv.id} className="py-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        {inv.project ? (
                          <Link href={`/projekte/${inv.project.slug}`} className="liq-link font-semibold text-navy">
                            {locale === 'en' ? inv.project.title.en ?? inv.project.title.de : inv.project.title.de}
                          </Link>
                        ) : (
                          <span className="font-semibold text-navy">–</span>
                        )}
                        <p className="text-xs text-muted">
                          {t('investmentDate')}: {formatDate(inv.created_at.slice(0, 10), locale)}
                          {inv.project && <> · {t('projectStatus')}: {tProjects(`statuses.${publicStatusOf(inv.project.status)}`)}</>}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-navy">{formatChf(Number(inv.amount_chf))}</span>
                        <Badge label={t(`investmentStatus.${inv.status}`)} variant={investmentVariant[inv.status]} />
                      </div>
                    </div>
                    <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-3">
                      <div>
                        <dt className="text-muted">{t('payment')}</dt>
                        <dd className="text-navy">
                          {pay ? <>{formatChf(Number(pay.amount_chf))} · {pay.status} · <span className="font-mono">{pay.provider_ref.slice(-8)}</span></> : '–'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted">{t('documents')}</dt>
                        <dd className="text-navy">
                          {docs.length === 0 ? (
                            t('noDocuments')
                          ) : (
                            <ul className="space-y-0.5">
                              {docs.map((d) => (
                                <li key={d.id}>
                                  <a href={`/api/dokumente/${d.id}`} target="_blank" rel="noopener" className="liq-link">
                                    {locale === 'en' ? d.title.en ?? d.title.de : d.title.de}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted">{t('tokens')}</dt>
                        <dd className="text-navy">
                          {inv.token_references?.length ? (
                            inv.token_references.map((tr) => (
                              <span key={tr.tx_hash} className="font-mono">{tr.token_amount} @ {tr.contract_address.slice(0, 10)}…</span>
                            ))
                          ) : (
                            <span className="text-muted">{t('tokensNone')}</span>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="liq-card p-6 sm:p-8">
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-accent">{t('profile')}</h2>
          {profile ? (
            <dl className="mt-4 space-y-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t('name')}</dt>
                <dd className="font-semibold text-navy">{profile.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t('email')}</dt>
                <dd className="font-semibold text-navy">{profile.email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t('role')}</dt>
                <dd>
                  <Badge label={t(`roles.${profile.role}`)} variant="info" />
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t('kyc')}</dt>
                <dd>
                  <Badge label={t(`kycStatus.${profile.kyc_status}`)} variant={kycVariant[profile.kyc_status]} />
                </dd>
              </div>
              <p className="text-xs leading-relaxed text-muted">{t('kycHint')}</p>
              <div className="flex justify-between gap-4 border-t border-navy/10 pt-4">
                <dt className="text-muted">{t('wallet')}</dt>
                <dd className="text-right text-xs text-muted">
                  {profile.wallet_address ? (
                    <code className="text-navy">{profile.wallet_address}</code>
                  ) : (
                    t('walletNone')
                  )}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-red-800" role="alert">
              {t('profileMissing')}
            </p>
          )}
        </div>

        <div className="liq-card p-6 sm:p-8">
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-accent">{t('nextTitle')}</h2>
          <ol className="mt-4 space-y-3">
            {nextSteps.map((step, i) => (
              <li key={step} className="flex gap-3 text-sm leading-relaxed text-body">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Section>
  );
}
