'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Menu, X } from 'lucide-react';
import { Link, usePathname } from '@/i18n/routing';
import { ButtonLink } from '@/components/ui/Button';
import LanguageToggle from '@/components/ui/LanguageToggle';
import Wordmark from '@/components/ui/Wordmark';
import type { AccountRole } from '@/lib/supabase/server';

const navItems = [
  { href: '/projekte', key: 'projects' },
  { href: '/so-funktioniert-es', key: 'howItWorks' },
  { href: '/fuer-emittenten', key: 'issuers' },
] as const;

export default function Navbar({ account }: { account: { role: AccountRole } | null }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Menü schliessen, sobald die Route wechselt
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Auf der Startseite liegt die Leiste oben transparent über der dunklen Titelfläche
  const inverse = pathname === '/' && !scrolled && !menuOpen;
  const accountHome = account?.role === 'emittent' ? '/emittent' : '/portfolio';

  const linkClass = (href: string) =>
    [
      'rounded px-2 py-1 text-sm font-semibold transition-colors duration-150',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      pathname === href || pathname.startsWith(`${href}/`)
        ? 'text-accent'
        : inverse
          ? 'text-onink-muted hover:text-onink'
          : 'text-muted hover:text-navy',
    ].join(' ');

  return (
    <header
      className={[
        'fixed left-0 right-0 top-0 z-50 border-b transition-all duration-300',
        inverse
          ? 'border-transparent bg-transparent text-onink'
          : 'border-navy/10 bg-cream/90 text-navy shadow-sm backdrop-blur',
      ].join(' ')}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={t('logoLabel')}
          >
            <Wordmark size="sm" />
          </Link>

          {/* Desktop */}
          <nav className="hidden items-center gap-6 md:flex" aria-label="Hauptnavigation">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                {t(item.key)}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-4 md:flex">
            <LanguageToggle inverse={inverse} />
            {account ? (
              <ButtonLink href={accountHome} size="sm">
                {t('account')}
              </ButtonLink>
            ) : (
              <>
                <Link href="/login" className={linkClass('/login')}>
                  {t('login')}
                </Link>
                <ButtonLink href="/registrieren" size="sm">
                  {t('register')}
                </ButtonLink>
              </>
            )}
          </div>

          {/* Mobile */}
          <button
            className={[
              'rounded-full p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:hidden',
              inverse ? 'text-onink hover:bg-white/10' : 'text-navy hover:bg-navy/5',
            ].join(' ')}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? t('menuClose') : t('menuOpen')}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div id="mobile-menu" className="border-t border-navy/10 bg-cream px-4 pb-5 pt-3 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Hauptnavigation mobil">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={`${linkClass(item.href)} py-2`}>
                {t(item.key)}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-3">
            <LanguageToggle />
            {account ? (
              <ButtonLink href={accountHome} size="sm" fullWidth onClick={() => setMenuOpen(false)}>
                {t('account')}
              </ButtonLink>
            ) : (
              <>
                <ButtonLink href="/login" variant="outline" size="sm" fullWidth onClick={() => setMenuOpen(false)}>
                  {t('login')}
                </ButtonLink>
                <ButtonLink href="/registrieren" size="sm" fullWidth onClick={() => setMenuOpen(false)}>
                  {t('register')}
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
