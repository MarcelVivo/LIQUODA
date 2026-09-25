import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import LegalPage from '@/components/sections/LegalPage';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'legal.haftung' });
  return { title: t('metaTitle') };
}

export default function Page() {
  return <LegalPage legalKey="haftung" />;
}
