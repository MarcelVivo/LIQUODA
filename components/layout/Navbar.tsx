'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Menu, X } from 'lucide-react';
import { Link, usePathname } from '@/i18n/routing';
import { ButtonLink } from '@/components/ui/Button';
import LanguageToggle from '@/components/ui/LanguageToggle';
import Wordmark from '@/components/ui/Wordmark';

const navItems = [
  { href: '/so-funktioniert-es', key: 'howItWorks' },
  { href: '/fuer-emittenten', key: 'issuers' },
] as const;

export default function Navbar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Menü schliessen, sobald die Route wechselt
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const linkClass = (href: string) =>
    [
      'rounded px-2 py-1 text-sm font-medium transition-colors duration-150',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy',
      pathname === href ? 'text-navy underline underline-offset-8 decoration-2' : 'text-navy/70 hover:text-navy',
    ].join(' ');

  return (
    <header
      className={[
        'fixed left-0 right-0 top-0 z-50 border-b transition-shadow duration-200',
        'bg-cream/95 backdrop-blur',
        scrolled ? 'border-navy/10 shadow-sm' : 'border-transparent',
      ].join(' ')}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
            aria-label={t('logoLabel')}
          >
            <Wordmark size="md" />
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
            <LanguageToggle />
            <ButtonLink href="/#warteliste" size="sm">
              {t('waitlist')}
            </ButtonLink>
          </div>

          {/* Mobile */}
          <button
            className="rounded p-2 text-navy hover:bg-navy/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy md:hidden"
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
            <ButtonLink href="/#warteliste" size="sm" fullWidth onClick={() => setMenuOpen(false)}>
              {t('waitlist')}
            </ButtonLink>
          </div>
        </div>
      )}
    </header>
  );
}
