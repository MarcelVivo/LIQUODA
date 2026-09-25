import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { redirect } from '@/i18n/routing';
import Section, { SectionHeading } from '@/components/ui/Section';
import { ButtonLink } from '@/components/ui/Button';
import AutoRefresh from '@/components/invest/AutoRefresh';
import { getAccount, hasSupabaseEnv } from '@/lib/supabase/server';
import { getInvestmentBySession, getOwnProfile } from '@/lib/investments';
import { formatChf } from '@/lib/format';

type Params = { locale: string; slug: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'invest.success' });
  return { title: t('metaTitle') };
}

/** Rückkehr von Stripe: Status der Investition anzeigen (Spec, Abschnitt 7 und 11). */
export default async function ConfirmationPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: { session_id?: string };
}) {
  const account = await getAccount();
  if (!account) redirect({ href: '/login', locale: params.locale });
  if (!hasSupabaseEnv() || !searchParams.session_id) notFound();

  const t = await getTranslations('invest.success');
  const profile = await getOwnProfile(account!.authId);
  const result = profile ? await getInvestmentBySession(searchParams.session_id, profile.id) : null;
  if (!result) notFound();

  const { investment, payment } = result;
  const paid = investment.status === 'paid' || investment.status === 'confirmed';
  const failed = investment.status === 'cancelled' || investment.status === 'refunded';
  const pending = !paid && !failed;

  const Icon = paid ? CheckCircle : failed ? XCircle : Clock;
  const title = paid ? t('paidTitle') : failed ? t('failedTitle') : t('pendingTitle');
  const text = paid ? t('paidText') : failed ? t('failedText') : t('pendingText');

  return (
    <Section className="pt-28 sm:pt-32">
      {pending && <AutoRefresh />}
      <SectionHeading as="h1" title={title} />
      <div className="liq-card mt-10 max-w-2xl p-6 sm:p-8" role="status">
        <Icon size={40} className={paid ? 'text-accent' : 'text-navy'} strokeWidth={1.5} aria-hidden="true" />
        <p className="mt-4 text-sm leading-relaxed text-body">{text}</p>
        <dl className="mt-6 space-y-2 border-t border-navy/10 pt-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{t('amount')}</dt>
            <dd className="font-semibold text-navy">{formatChf(Number(investment.amount_chf))}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{t('total')}</dt>
            <dd className="font-semibold text-navy">{formatChf(Number(payment.amount_chf))}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{t('reference')}</dt>
            <dd className="font-mono text-xs text-navy">{investment.id.slice(0, 8)}</dd>
          </div>
        </dl>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/portfolio" size="sm">
            {t('toPortfolio')}
          </ButtonLink>
          {failed && (
            <ButtonLink href={`/investieren/${params.slug}`} variant="outline" size="sm">
              {t('retry')}
            </ButtonLink>
          )}
        </div>
      </div>
    </Section>
  );
}
