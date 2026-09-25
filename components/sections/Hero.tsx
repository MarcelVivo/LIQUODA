import { useTranslations } from 'next-intl';
import { ButtonLink } from '@/components/ui/Button';
import Wordmark from '@/components/ui/Wordmark';
import WaveBackground from '@/components/ui/WaveBackground';

/**
 * Titelbereich, gestaltet nach der ersten Folie der Präsentation:
 * dunkle Ink-Fläche, driftende Blobs, 3D-Netzwelle, Logo mit Schimmer
 * und Verflüssigung, Tagline, Kicker, Titel. Elemente blenden gestaffelt ein.
 */
export default function Hero() {
  const t = useTranslations('home.hero');
  const tCommon = useTranslations('common');

  return (
    <section
      id="hero"
      className="liq-dark relative isolate flex min-h-[100svh] items-center overflow-hidden bg-navy text-onink"
      aria-label="Einstieg"
    >
      <div className="liq-blob liq-blob-1" aria-hidden="true" />
      <div className="liq-blob liq-blob-2" aria-hidden="true" />
      <WaveBackground />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-4 pb-20 pt-28 text-center sm:px-6 sm:pt-32 lg:px-8">
        <div className="animate-logoIn">
          <Wordmark size="hero" liquid />
        </div>

        <p
          className="liq-rise mt-3 text-sm font-normal uppercase tracking-[0.28em] text-onink-muted sm:text-base"
          style={{ '--d': '0.13s' } as React.CSSProperties}
        >
          {tCommon('tagline')}
        </p>

        <p className="liq-rise liq-kicker mt-12" style={{ '--d': '0.21s' } as React.CSSProperties}>
          {t('eyebrow')}
        </p>

        <h1
          className="liq-rise mt-4 max-w-4xl text-3xl font-extrabold leading-[1.12] tracking-tight text-onink sm:text-4xl lg:text-5xl"
          style={{ '--d': '0.29s' } as React.CSSProperties}
        >
          {t('title')}
        </h1>

        <p
          className="liq-rise mt-6 max-w-3xl text-base leading-relaxed text-onink-chip sm:text-lg"
          style={{ '--d': '0.37s' } as React.CSSProperties}
        >
          {t('lead')}
        </p>

        <div
          className="liq-rise mt-10 flex flex-col gap-3 sm:flex-row"
          style={{ '--d': '0.45s' } as React.CSSProperties}
        >
          <ButtonLink href="/so-funktioniert-es#investoren" size="lg">
            {t('ctaInvestors')}
          </ButtonLink>
          <ButtonLink href="/fuer-emittenten" variant="inverse" size="lg">
            {t('ctaIssuers')}
          </ButtonLink>
        </div>

        <p
          className="liq-rise liq-chip mt-10 max-w-2xl border-onink-muted/30 text-onink-chip"
          style={{ '--d': '0.53s' } as React.CSSProperties}
        >
          {t('note')}
        </p>
      </div>
    </section>
  );
}
