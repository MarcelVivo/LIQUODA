import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Info } from 'lucide-react';
import { redirect } from '@/i18n/routing';
import Section, { SectionHeading } from '@/components/ui/Section';
import { ButtonLink } from '@/components/ui/Button';
import { getAccount, hasSupabaseEnv } from '@/lib/supabase/server';
import { cancelReservedInvestment, getOwnProfile } from '@/lib/investments';

type Params = { locale: string; slug: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'invest.cancelled' });
  return { title: t('metaTitle') };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Abbruch bei Stripe: Reservation freigeben, keine Verpflichtung (Spec, Abschnitt 11). */
export default async function CancelledPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: { inv?: string };
}) {
  const account = await getAccount();
  if (!account) redirect({ href: '/login', locale: params.locale });

  const t = await getTranslations('invest.cancelled');
  if (hasSupabaseEnv() && searchParams.inv && UUID_RE.test(searchParams.inv)) {
    const profile = await getOwnProfile(account!.authId);
    if (profile) await cancelReservedInvestment(searchParams.inv, profile.id);
  }

  return (
    <Section className="pt-28 sm:pt-32">
      <SectionHeading as="h1" title={t('title')} />
      <div className="liq-card mt-10 max-w-2xl p-6 sm:p-8" role="status">
        <Info size={40} className="text-navy" strokeWidth={1.5} aria-hidden="true" />
        <p className="mt-4 text-sm leading-relaxed text-body">{t('text')}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={`/investieren/${params.slug}`} size="sm">
            {t('retry')}
          </ButtonLink>
          <ButtonLink href={`/projekte/${params.slug}`} variant="outline" size="sm">
            {t('toProject')}
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}
