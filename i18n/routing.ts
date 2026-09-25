import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['de', 'en'],
  defaultLocale: 'de',
  localePrefix: 'as-needed',
});

export type Locale = (typeof routing.locales)[number];

// Locale-sichere Navigation: <Link href="/fuer-emittenten"> ergibt
// "/fuer-emittenten" (DE) bzw. "/en/fuer-emittenten" (EN).
// Die Slugs bleiben in beiden Sprachen deutsch (siehe Spec, Abschnitt 3).
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
