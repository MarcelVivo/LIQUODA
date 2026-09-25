'use client';

import { useLocale } from 'next-intl';
import { useTransition } from 'react';
import { routing, usePathname, useRouter, type Locale } from '@/i18n/routing';

export default function LanguageToggle({ inverse = false }: { inverse?: boolean }) {
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
      className={[
        'flex items-center gap-1 rounded-full border p-0.5 transition-colors',
        inverse ? 'border-onink-muted/40' : 'border-navy/20',
      ].join(' ')}
      role="group"
      aria-label="Sprache / Language"
    >
      {routing.locales.map((l) => {
        const active = locale === l;
        return (
          <button
            key={l}
            onClick={() => switchLocale(l)}
            disabled={isPending}
            aria-pressed={active}
            className={[
              'rounded-full px-2.5 py-1 text-xs font-bold tracking-wider transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              active
                ? 'bg-accent text-white'
                : inverse
                  ? 'text-onink-muted hover:text-onink'
                  : 'text-muted hover:text-navy',
            ].join(' ')}
          >
            {l.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
