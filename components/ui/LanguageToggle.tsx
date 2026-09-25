'use client';

import { useLocale } from 'next-intl';
import { useTransition } from 'react';
import { routing, usePathname, useRouter, type Locale } from '@/i18n/routing';

export default function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (nextLocale: Locale) => {
    if (nextLocale === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <div
      className="flex items-center gap-1 rounded-md border border-navy/20 p-0.5"
      role="group"
      aria-label="Sprache / Language"
    >
      {routing.locales.map((l) => (
        <button
          key={l}
          onClick={() => switchLocale(l)}
          disabled={isPending}
          aria-pressed={locale === l}
          className={[
            'rounded px-2.5 py-1 text-sm font-medium transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1',
            locale === l ? 'bg-navy text-white' : 'text-navy/60 hover:text-navy',
          ].join(' ')}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
