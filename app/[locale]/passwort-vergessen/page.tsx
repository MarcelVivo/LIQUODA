import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Section, { SectionHeading } from '@/components/ui/Section';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'auth.reset' });
  return { title: t('metaTitle') };
}

export default async function ResetPasswordPage() {
  const t = await getTranslations('auth.reset');
  return (
    <Section className="pt-28 sm:pt-32">
      <SectionHeading as="h1" title={t('title')} lead={t('lead')} />
      <div className="mt-10 max-w-xl"><ResetPasswordForm /></div>
    </Section>
  );
}
