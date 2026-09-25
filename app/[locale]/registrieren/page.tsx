import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Section, { SectionHeading } from '@/components/ui/Section';
import RegisterAccountForm from '@/components/auth/RegisterAccountForm';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'auth.register' });
  return { title: t('metaTitle') };
}

export default async function RegisterPage() {
  const t = await getTranslations('auth.register');
  return (
    <Section className="pt-28 sm:pt-32">
      <SectionHeading as="h1" title={t('title')} lead={t('lead')} />
      <div className="mt-10 max-w-xl">
        <RegisterAccountForm />
      </div>
    </Section>
  );
}
