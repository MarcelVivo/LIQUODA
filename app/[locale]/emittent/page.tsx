import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { redirect } from '@/i18n/routing';
import EmittentDashboard from '@/components/emittent/EmittentDashboard';
import { getAccount } from '@/lib/supabase/server';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'auth.account' });
  return { title: t('issuerTitle') };
}

// Zugriff wird bereits in middleware.ts geprüft; hier zur Sicherheit erneut.
export default async function Page({ params }: { params: { locale: string } }) {
  const account = await getAccount();
  if (!account) redirect({ href: '/login', locale: params.locale });
  if (account!.role !== 'emittent' && account!.role !== 'admin') {
    redirect({ href: '/portfolio', locale: params.locale });
  }
  return <EmittentDashboard account={account!} />;
}
