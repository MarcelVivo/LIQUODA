import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  // requestLocale is the locale resolved by the middleware
  const locale = (await requestLocale) ?? 'de';

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
