import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { redirect } from '@/i18n/routing';
import Section, { SectionHeading } from '@/components/ui/Section';
import NewPasswordForm from '@/components/auth/NewPasswordForm';
import { getAccount } from '@/lib/supabase/server';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'auth.newPassword' });
  return { title: t('metaTitle') };
}

/** Erreichbar nach dem Klick auf den Link aus der E-Mail (Sitzung vorhanden) oder für angemeldete Nutzer. */
export default async function NewPasswordPage({ params }: { params: { locale: string } }) {
  const account = await getAccount();
  if (!account) redirect({ href: '/login?error=link_invalid', locale: params.locale });
  const t = await getTranslations('auth.newPassword');
  const prefix = params.locale === 'en' ? '/en' : '';
  const home = account!.role === 'emittent' ? `${prefix}/emittent` : `${prefix}/portfolio`;
  return (
    <Section className="pt-28 sm:pt-32">
      <SectionHeading as="h1" title={t('title')} lead={t('lead')} />
      <div className="mt-10 max-w-xl"><NewPasswordForm home={home} /></div>
    </Section>
  );
}
