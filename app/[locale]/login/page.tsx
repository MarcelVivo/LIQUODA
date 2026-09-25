import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Section, { SectionHeading } from '@/components/ui/Section';
import LoginForm from '@/components/auth/LoginForm';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'auth.login' });
  return { title: t('metaTitle') };
}

const NOTICES = ['link_invalid', 'not_configured'] as const;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  const t = await getTranslations('auth.login');
  const next = searchParams.next?.startsWith('/') && !searchParams.next.startsWith('//') ? searchParams.next : undefined;
  const notice = (NOTICES as readonly string[]).includes(searchParams.error ?? '')
    ? t(`notices.${searchParams.error as (typeof NOTICES)[number]}`)
    : undefined;

  return (
    <Section className="pt-28 sm:pt-32">
      <SectionHeading as="h1" title={t('title')} lead={t('lead')} />
      <div className="mt-10 max-w-xl">
        <LoginForm next={next} notice={notice} />
      </div>
    </Section>
  );
}
