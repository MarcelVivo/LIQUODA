import { useTranslations } from 'next-intl';
import { ButtonLink } from '@/components/ui/Button';
import Wordmark from '@/components/ui/Wordmark';

export default function Hero() {
  const t = useTranslations('home.hero');

  return (
    <section id="hero" className="bg-cream pt-16" aria-label="Einstieg">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="max-w-3xl">
          <Wordmark size="xl" />
          <p className="mt-6 text-sm font-medium uppercase tracking-wider text-navy/60">
            {t('eyebrow')}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl lg:text-5xl">
            {t('title')}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-navy/80">{t('lead')}</p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/so-funktioniert-es#investoren" size="lg">
              {t('ctaInvestors')}
            </ButtonLink>
            <ButtonLink href="/fuer-emittenten" variant="outline" size="lg">
              {t('ctaIssuers')}
            </ButtonLink>
          </div>

          <p className="mt-8 max-w-2xl border-l-2 border-navy/20 pl-4 text-sm leading-relaxed text-navy/70">
            {t('note')}
          </p>
        </div>
      </div>
    </section>
  );
}
