import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../[locale]/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = { title: 'LIQUODA Admin' };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
