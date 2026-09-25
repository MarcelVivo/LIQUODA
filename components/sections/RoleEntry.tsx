import { useTranslations } from 'next-intl';
import { Building2, Users, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import Section, { SectionHeading } from '@/components/ui/Section';

export default function RoleEntry() {
  const t = useTranslations('home.roles');

  const roles = [
    {
      Icon: Building2,
      title: t('issuersTitle'),
      text: t('issuersText'),
      link: t('issuersLink'),
      href: '/fuer-emittenten',
    },
    {
      Icon: Users,
      title: t('investorsTitle'),
      text: t('investorsText'),
      link: t('investorsLink'),
      href: '/so-funktioniert-es#investoren',
    },
  ];

  return (
    <Section id="fuer-wen" ariaLabel={t('title')}>
      <SectionHeading title={t('title')} />
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {roles.map((role) => (
          <article key={role.href} className="flex flex-col liq-card liq-card-hover p-6 sm:p-8">
            <role.Icon size={28} className="text-navy" strokeWidth={1.5} aria-hidden="true" />
            <h3 className="mt-4 text-xl font-semibold text-navy">{role.title}</h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{role.text}</p>
            <Link
              href={role.href}
              className="liq-link mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-navy"
            >
              {role.link}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </article>
        ))}
      </div>
    </Section>
  );
}
