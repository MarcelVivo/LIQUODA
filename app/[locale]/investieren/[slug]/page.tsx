import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { Link, redirect } from '@/i18n/routing';
import Section, { SectionHeading } from '@/components/ui/Section';
import { ButtonLink } from '@/components/ui/Button';
import InvestFlow from '@/components/invest/InvestFlow';
import { getAccount } from '@/lib/supabase/server';
import { getProjectBySlug, publicStatus, type Locale } from '@/lib/projects';
import { daysUntil } from '@/lib/format';
import { getOpenAmountChf, getOwnProfile } from '@/lib/investments';

type Params = { locale: string; slug: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'invest' });
  return { title: t('metaTitle') };
}

function Blocked({ title, text, links }: { title: string; text: string; links: { href: string; label: string; primary?: boolean }[] }) {
  return (
    <div className="liq-card max-w-2xl border-l-4 border-accent p-6 sm:p-8" role="status">
      <h2 className="text-xl font-bold text-navy">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {links.map((l) => (
          <ButtonLink key={l.href} href={l.href} variant={l.primary ? 'primary' : 'outline'} size="sm">
            {l.label}
          </ButtonLink>
        ))}
      </div>
    </div>
  );
}

// Zugang: Middleware verlangt Investor-Login. Hier: KYC, Projektstatus, Laufzeit (Spec, Abschnitt 7).
export default async function InvestPage({ params }: { params: Params }) {
  const account = await getAccount();
  if (!account) redirect({ href: `/login?next=/investieren/${params.slug}`, locale: params.locale });

  const project = await getProjectBySlug(params.slug);
  if (!project) notFound();

  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('invest');
  const tProjects = await getTranslations('projects');
  const profile = await getOwnProfile(account!.authId);

  const projectHref = `/projekte/${project.slug}`;
  const open = publicStatus(project) === 'open' && daysUntil(project.deadline) >= 0;

  let content: React.ReactNode;
  if (!open) {
    content = (
      <Blocked
        title={t('blocked.projectTitle')}
        text={t('blocked.projectClosed')}
        links={[{ href: projectHref, label: t('blocked.toProject'), primary: true }]}
      />
    );
  } else if (!profile || profile.kyc_status !== 'approved') {
    content = (
      <Blocked
        title={t('blocked.kycTitle')}
        text={profile?.kyc_status === 'rejected' ? t('blocked.kycRejected') : t('blocked.kycPending')}
        links={[
          { href: '/portfolio', label: t('blocked.toAccount'), primary: true },
          { href: projectHref, label: t('blocked.toProject') },
        ]}
      />
    );
  } else {
    const openAmount = await getOpenAmountChf(project.id, project.targetAmountChf);
    content = (
      <InvestFlow
        project={{
          slug: project.slug,
          title: project.title[locale],
          issuerName: project.issuerName,
          minInvestmentChf: project.minInvestmentChf,
          openAmountChf: openAmount,
          deadline: project.deadline,
          tokenModelLabel: tProjects(`detail.tokenModels.${project.tokenModel}`),
        }}
      />
    );
  }

  return (
    <Section className="pt-28 sm:pt-32">
      <Link href={projectHref} className="liq-link inline-flex items-center gap-1.5 text-sm text-muted">
        <ArrowLeft size={16} aria-hidden="true" />
        {tProjects('detail.back')}
      </Link>
      <div className="mt-6">
        <SectionHeading as="h1" title={t('title')} kicker={project.title[locale]} />
      </div>
      <div className="mt-10">{content}</div>
    </Section>
  );
}
