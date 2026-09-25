import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import Section, { SectionHeading } from '@/components/ui/Section';
import { ButtonLink } from '@/components/ui/Button';
import ProcessSteps, { type ProcessStep } from '@/components/sections/ProcessSteps';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'howItWorks' });
  return { title: t('metaTitle'), description: t('metaDescription') };
}

type FailureItem = { title: string; text: string };

export default function HowItWorksPage() {
  const t = useTranslations('howItWorks');
  const investorSteps = t.raw('investorSteps') as ProcessStep[];
  const issuerSteps = t.raw('issuerSteps') as ProcessStep[];
  const failureItems = t.raw('failureItems') as FailureItem[];

  return (
    <>
      <Section className="pt-28 sm:pt-32" ariaLabel={t('title')}>
        <SectionHeading as="h1" title={t('title')} lead={t('lead')} />
      </Section>

      <Section id="investoren" tone="white" ariaLabel={t('investorsTitle')}>
        <SectionHeading title={t('investorsTitle')} lead={t('investorsIntro')} />
        <ProcessSteps steps={investorSteps} />
      </Section>

      <Section id="emittenten" ariaLabel={t('issuersTitle')}>
        <SectionHeading title={t('issuersTitle')} lead={t('issuersIntro')} />
        <ProcessSteps steps={issuerSteps} />
      </Section>

      <Section id="abbruch" tone="navy" ariaLabel={t('failureTitle')}>
        <SectionHeading title={t('failureTitle')} lead={t('failureLead')} />
        <dl className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2">
          {failureItems.map((item) => (
            <div key={item.title} className="border-t border-white/10 pt-5">
              <dt className="text-base font-semibold text-onink">{item.title}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-onink-muted">{item.text}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section tone="white" ariaLabel={t('ctaTitle')}>
        <SectionHeading title={t('ctaTitle')} lead={t('ctaText')} />
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/#warteliste">{t('ctaWaitlist')}</ButtonLink>
          <ButtonLink href="/fuer-emittenten#projektanfrage" variant="outline">
            {t('ctaIssuers')}
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
