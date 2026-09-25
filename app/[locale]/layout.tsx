import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing, type Locale } from '@/i18n/routing';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { getAccount } from '@/lib/supabase/server';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'common' });
  const description = t('role');
  return {
    title: {
      default: 'LIQUODA',
      template: '%s – LIQUODA',
    },
    description,
    metadataBase: new URL('https://www.liquoda.com'),
    openGraph: {
      title: 'LIQUODA',
      description,
      url: 'https://www.liquoda.com',
      siteName: 'LIQUODA',
      locale: params.locale === 'en' ? 'en_GB' : 'de_CH',
      type: 'website',
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();
  const account = await getAccount();

  return (
    <html lang={locale} className={inter.variable}>
      <body className="flex min-h-screen flex-col">
        {/* Seitenhintergrund wie in der Präsentation: Verlauf, Blobs, Wellenlinien */}
        <div className="liq-page-bg" aria-hidden="true">
          <div className="liq-blob liq-blob-1" />
          <div className="liq-blob liq-blob-2" />
          <div className="liq-wavelines" />
        </div>
        <NextIntlClientProvider messages={messages}>
          <Navbar account={account ? { role: account.role } : null} />
          <main className="relative z-10 flex-1">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
