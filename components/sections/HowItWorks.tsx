import { useTranslations } from 'next-intl';
import { UserPlus, Search, Coins } from 'lucide-react';

const stepIcons = [UserPlus, Search, Coins];

export default function HowItWorks() {
  const t = useTranslations('howItWorks');

  const steps = [
    {
      Icon: stepIcons[0],
      title: t('step1Title'),
      desc: t('step1Desc'),
    },
    {
      Icon: stepIcons[1],
      title: t('step2Title'),
      desc: t('step2Desc'),
    },
    {
      Icon: stepIcons[2],
      title: t('step3Title'),
      desc: t('step3Desc'),
    },
  ];

  return (
    <section id="how-it-works" className="bg-surface py-24" aria-label="How it works">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
          {t('title')}
        </h2>

        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {steps.map((step, index) => (
            <article
              key={step.title}
              className="flex flex-col items-center rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100"
            >
              {/* Step number + icon */}
              <div className="relative mb-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy/8">
                  <step.Icon size={28} className="text-navy" strokeWidth={1.5} />
                </div>
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
                  {index + 1}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-navy">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{step.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
