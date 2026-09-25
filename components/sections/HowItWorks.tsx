import { useTranslations } from 'next-intl';
import { BookOpen, Search, UserCheck, ClipboardCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import Section, { SectionHeading } from '@/components/ui/Section';

const stepIcons = [BookOpen, Search, UserCheck, ClipboardCheck, CheckCircle2];

type Step = { title: string; text: string };

export default function HowItWorks() {
  const t = useTranslations('home.steps');
  const steps = t.raw('items') as Step[];

  return (
    <Section id="ablauf" tone="white" ariaLabel={t('title')}>
      <SectionHeading title={t('title')} lead={t('lead')} />

      <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((step, index) => {
          const Icon = stepIcons[index] ?? CheckCircle2;
          return (
            <li key={step.title} className="flex flex-col rounded-xl bg-cream p-6 ring-1 ring-navy/10">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <Icon size={22} className="text-navy" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-navy">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy/80">{step.text}</p>
            </li>
          );
        })}
      </ol>

      <Link
        href="/so-funktioniert-es"
        className="liq-link mt-10 inline-flex items-center gap-1.5 text-sm font-medium text-navy"
      >
        {t('link')}
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </Section>
  );
}
