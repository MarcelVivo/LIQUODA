import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { Link, redirect } from '@/i18n/routing';
import Section, { SectionHeading } from '@/components/ui/Section';
import ProfileEditForm from '@/components/community/ProfileEditForm';
import { createSupabaseServerClient, getAccount } from '@/lib/supabase/server';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'community.profileEdit' });
  return { title: t('title') };
}

export default async function EmittentProfileEditPage({ params }: { params: { locale: string } }) {
  const account = await getAccount();
  if (!account) redirect({ href: '/login', locale: params.locale });
  if (account!.role !== 'emittent') redirect({ href: '/portfolio', locale: params.locale });
  const t = await getTranslations('community.profileEdit');
  const tDash = await getTranslations('emittent.wizard');
  const { data } = await createSupabaseServerClient().from('users').select('bio, website, profile_slug').eq('auth_id', account!.authId).maybeSingle();
  const bio = (data?.bio as { de?: string; en?: string } | null) ?? {};
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.liquoda.com').replace(/\/$/, '');
  const profileUrl = data?.profile_slug ? `${site}${params.locale === 'en' ? '/en' : ''}/emittenten/${data.profile_slug}` : null;

  return (
    <Section className="pt-28 sm:pt-32">
      <Link href="/emittent" className="liq-link inline-flex items-center gap-1.5 text-sm text-muted"><ArrowLeft size={16} aria-hidden="true" />{tDash('back')}</Link>
      <div className="mt-6"><SectionHeading as="h1" title={t('title')} lead={t('lead')} /></div>
      <div className="mt-10 max-w-2xl">
        <ProfileEditForm bio={{ de: bio.de ?? '', en: bio.en ?? '' }} website={(data?.website as string | null) ?? ''} profileUrl={profileUrl} />
      </div>
    </Section>
  );
}
