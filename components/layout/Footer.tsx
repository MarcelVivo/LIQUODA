import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          {/* Brand */}
          <div>
            <p className="text-xl font-bold tracking-tight">{t('brand')}</p>
            <p className="mt-1 text-sm text-white/60">{t('slogan')}</p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer navigation">
            <a
              href="#"
              className="text-sm text-white/70 hover:text-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
            >
              {t('impressum')}
            </a>
            <a
              href="#"
              className="text-sm text-white/70 hover:text-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
            >
              {t('datenschutz')}
            </a>
            <a
              href="#"
              className="text-sm text-white/70 hover:text-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
            >
              {t('agb')}
            </a>
          </nav>

          {/* Copyright */}
          <p className="text-sm text-white/50">{t('copyright')}</p>
        </div>
      </div>
    </footer>
  );
}
