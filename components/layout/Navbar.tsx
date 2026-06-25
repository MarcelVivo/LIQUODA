'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Menu, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import LanguageToggle from '@/components/ui/LanguageToggle';

export default function Navbar() {
  const t = useTranslations('nav');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToRegister = () => {
    setMenuOpen(false);
    document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header
      className={[
        'fixed top-0 left-0 right-0 z-50 transition-shadow duration-200',
        'bg-white',
        scrolled ? 'shadow-sm' : '',
      ].join(' ')}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <a
            href="#"
            className="text-xl font-bold tracking-tight text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy rounded"
          >
            {t('brand')}
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageToggle />
            <Button size="sm" onClick={scrollToRegister}>
              {t('register')}
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded text-navy hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-3">
          <div className="flex flex-col gap-3">
            <LanguageToggle />
            <Button size="sm" onClick={scrollToRegister} fullWidth>
              {t('register')}
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
