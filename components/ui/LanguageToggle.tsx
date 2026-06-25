'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';

export default function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (nextLocale: string) => {
    if (nextLocale === locale) return;

    startTransition(() => {
      // Strip the current locale prefix and rebuild with new one
      let newPath = pathname;

      if (pathname.startsWith('/en')) {
        newPath = pathname.replace(/^\/en/, '') || '/';
      } else if (pathname.startsWith('/de')) {
        newPath = pathname.replace(/^\/de/, '') || '/';
      }

      if (nextLocale === 'en') {
        router.push(`/en${newPath === '/' ? '' : newPath}`);
      } else {
        // 'de' is the default locale — no prefix needed
        router.push(newPath || '/');
      }
    });
  };

  return (
    <div
      className="flex items-center gap-1 rounded-md border border-gray-200 p-0.5"
      aria-label="Language selection"
    >
      <button
        onClick={() => switchLocale('de')}
        disabled={isPending}
        aria-pressed={locale === 'de'}
        className={[
          'rounded px-2.5 py-1 text-sm font-medium transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1',
          locale === 'de'
            ? 'bg-navy text-white'
            : 'text-gray-500 hover:text-navy',
        ].join(' ')}
      >
        DE
      </button>
      <button
        onClick={() => switchLocale('en')}
        disabled={isPending}
        aria-pressed={locale === 'en'}
        className={[
          'rounded px-2.5 py-1 text-sm font-medium transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1',
          locale === 'en'
            ? 'bg-navy text-white'
            : 'text-gray-500 hover:text-navy',
        ].join(' ')}
      >
        EN
      </button>
    </div>
  );
}
