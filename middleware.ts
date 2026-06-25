import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['de', 'en'],
  defaultLocale: 'de',
  localePrefix: 'as-needed', // /de/... becomes /..., /en/... stays /en/...
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
