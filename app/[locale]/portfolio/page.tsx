import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { redirect } from '@/i18n/routing';
import AccountOverview from '@/components/auth/AccountOverview';
import { getAccount } from '@/lib/supabase/server';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'auth.account' });
  return { title: t('portfolioTitle') };
}

// Zugriff wird bereits in middleware.ts geprüft; hier zur Sicherheit erneut.
export default async function Page({ params }: { params: { locale: string } }) {
  const account = await getAccount();
  if (!account) redirect({ href: '/login', locale: params.locale });
  if (account!.role !== 'investor' && account!.role !== 'admin') {
    redirect({ href: '/emittent', locale: params.locale });
  }
  return <AccountOverview account={account!} variant="investor" />;
}
