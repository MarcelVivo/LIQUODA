import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import Wordmark from '@/components/ui/Wordmark';

const navLinks = [
  { href: '/', key: 'home' },
  { href: '/so-funktioniert-es', key: 'howItWorks' },
  { href: '/fuer-emittenten', key: 'issuers' },
] as const;

const legalLinks = [
  { href: '/impressum', key: 'impressum' },
  { href: '/datenschutz', key: 'datenschutz' },
  { href: '/agb', key: 'agb' },
  { href: '/risiken', key: 'risiken' },
  { href: '/haftung', key: 'haftung' },
] as const;

const linkClass =
  'text-sm text-cream/70 transition-colors duration-150 hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream rounded';

export default function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');

  return (
    <footer className="bg-navy text-cream">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr]">
          {/* Rolle und Risikohinweis (Pflichtinhalte, Spec Abschnitt 2) */}
          <div>
            <Wordmark size="md" />
            <h2 className="mt-6 text-sm font-semibold uppercase tracking-wider text-cream/60">
              {t('roleTitle')}
            </h2>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-cream/80">{t('roleText')}</p>
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-cream/80">{t('riskText')}</p>
          </div>

          <nav aria-label={t('navTitle')}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-cream/60">
              {t('navTitle')}
            </h2>
            <ul className="mt-3 space-y-2">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkClass}>
                    {tNav(l.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={t('legalTitle')}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-cream/60">
              {t('legalTitle')}
            </h2>
            <ul className="mt-3 space-y-2">
              {legalLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkClass}>
                    {t(l.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className="mt-12 border-t border-cream/10 pt-6 text-xs text-cream/50">{t('copyright')}</p>
      </div>
    </footer>
  );
}
