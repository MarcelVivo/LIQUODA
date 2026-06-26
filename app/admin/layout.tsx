import type { Metadata } from 'next';
import '../[locale]/globals.css';

export const metadata: Metadata = { title: 'LIQUODA Admin' };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body style={{ fontFamily: 'var(--font-inter, system-ui, sans-serif)' }}>
        {children}
      </body>
    </html>
  );
}
