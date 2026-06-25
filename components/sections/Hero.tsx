import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';

// Client wrapper only needed for scroll, but we can keep hero as server component
// and use anchor links that trigger CSS scroll-behavior: smooth
function ScrollButton({ href, variant, children }: {
  href: string;
  variant: 'primary' | 'outline';
  children: React.ReactNode;
}) {
  return (
    <a href={href}>
      <Button variant={variant} size="lg">
        {children}
      </Button>
    </a>
  );
}

export default function Hero() {
  const t = useTranslations('hero');

  return (
    <section
      id="hero"
      className="bg-grid relative flex min-h-[calc(100vh-4rem)] items-center justify-center bg-white pt-16"
      aria-label="Hero"
    >
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:px-8">
        {/* Brand mark */}
        <h1 className="text-6xl font-bold tracking-tight text-navy sm:text-7xl lg:text-8xl">
          {t('brand')}
        </h1>

        {/* Slogan */}
        <p className="mt-4 text-xl font-medium text-gray-400 sm:text-2xl">
          {t('slogan')}
        </p>

        {/* Description */}
        <p className="mt-6 text-lg leading-relaxed text-gray-600 sm:text-xl">
          {t('description')}
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ScrollButton href="#register" variant="outline">
            {t('ctaList')}
          </ScrollButton>
          <ScrollButton href="#register" variant="primary">
            {t('ctaInvest')}
          </ScrollButton>
        </div>
      </div>
    </section>
  );
}
