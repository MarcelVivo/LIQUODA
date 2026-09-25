import { getTranslations } from 'next-intl/server';
import Badge from '@/components/ui/Badge';
import Section, { SectionHeading } from '@/components/ui/Section';
import LogoutButton from '@/components/auth/LogoutButton';
import { createSupabaseServerClient, type Account } from '@/lib/supabase/server';

type Profile = {
  name: string;
  email: string;
  role: 'investor' | 'emittent' | 'admin';
  kyc_status: 'pending' | 'approved' | 'rejected';
  wallet_address: string | null;
};

const kycVariant = { pending: 'neutral', approved: 'active', rejected: 'info' } as const;

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
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from('users')
    .select('name, email, role, kyc_status, wallet_address')
    .eq('auth_id', account.authId)
    .maybeSingle();
  const profile = data as Profile | null;
  const nextSteps = t.raw(variant === 'emittent' ? 'nextIssuer' : 'nextInvestor') as string[];

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

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1fr]">
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
