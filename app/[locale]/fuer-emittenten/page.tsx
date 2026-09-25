import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import Section, { SectionHeading } from '@/components/ui/Section';
import ProcessSteps, { type ProcessStep } from '@/components/sections/ProcessSteps';
import Packages from '@/components/sections/Packages';
import ProjectRequestForm from '@/components/sections/ProjectRequestForm';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'issuers' });
  return { title: t('metaTitle'), description: t('metaDescription') };
}

type Benefit = { title: string; text: string };

export default function IssuersPage() {
  const t = useTranslations('issuers');
  const benefits = t.raw('benefits') as Benefit[];
  const requirements = t.raw('requirements') as string[];
  const processSteps = t.raw('processSteps') as ProcessStep[];

  return (
    <>
      <Section className="pt-28 sm:pt-32" ariaLabel={t('title')}>
        <SectionHeading as="h1" title={t('title')} lead={t('lead')} />
      </Section>

      <Section id="nutzen" tone="white" ariaLabel={t('benefitsTitle')}>
        <SectionHeading title={t('benefitsTitle')} />
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {benefits.map((b) => (
            <article key={b.title} className="liq-card liq-card-hover p-6">
              <h3 className="text-base font-semibold text-navy">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{b.text}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section id="voraussetzungen" ariaLabel={t('requirementsTitle')}>
        <SectionHeading title={t('requirementsTitle')} />
        <ul className="mt-8 max-w-2xl space-y-3">
          {requirements.map((r) => (
            <li key={r} className="flex gap-3 text-sm leading-relaxed text-muted">
              <Check size={18} className="mt-0.5 shrink-0 text-accent-start" aria-hidden="true" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="ablauf" tone="white" ariaLabel={t('processTitle')}>
        <SectionHeading title={t('processTitle')} />
        <ProcessSteps steps={processSteps} />
      </Section>

      <Packages />
      <ProjectRequestForm />
    </>
  );
}
