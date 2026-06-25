import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LIQUODA — Real Assets. Digital Security.',
  description:
    'LIQUODA ist die Schweizer Plattform für tokenisierte Investitionen. Verbindet Emittenten und Investoren sicher und transparent.',
  metadataBase: new URL('https://www.liquoda.com'),
  openGraph: {
    title: 'LIQUODA — Real Assets. Digital Security.',
    description:
      'Die Schweizer Plattform für tokenisierte Investitionen in reale Projekte.',
    url: 'https://www.liquoda.com',
    siteName: 'LIQUODA',
    locale: 'de_CH',
    type: 'website',
  },
};

const locales = ['de', 'en'];

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;

  if (!locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className={inter.variable}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
