import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { Link, redirect } from '@/i18n/routing';
import Section, { SectionHeading } from '@/components/ui/Section';
import Badge from '@/components/ui/Badge';
import ProjectWizard from '@/components/emittent/ProjectWizard';
import { getAccount } from '@/lib/supabase/server';
import { getOwnProject, listProjectDocuments, submissionProblems } from '@/lib/emittent';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'emittent.wizard' });
  return { title: t('title') };
}

export default async function ProjectWizardPage({ params }: { params: { locale: string; id: string } }) {
  const account = await getAccount();
  if (!account) redirect({ href: '/login', locale: params.locale });
  if (account!.role !== 'emittent' && account!.role !== 'admin') redirect({ href: '/portfolio', locale: params.locale });

  const project = await getOwnProject(params.id);
  if (!project) notFound();

  const t = await getTranslations('emittent.wizard');
  const tDash = await getTranslations('emittent.dashboard');
  const locale = (await getLocale()) as 'de' | 'en';
  const documents = await listProjectDocuments(project.id);
  const problems = submissionProblems(project, documents);

  return (
    <Section className="pt-28 sm:pt-32">
      <Link href="/emittent" className="liq-link inline-flex items-center gap-1.5 text-sm text-muted">
        <ArrowLeft size={16} aria-hidden="true" />
        {t('back')}
      </Link>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <SectionHeading as="h1" title={t('title')} kicker={project.title[locale] || project.title.de} />
        <Badge label={tDash(`statuses.${project.status}`)} variant={project.status === 'draft' ? 'neutral' : 'info'} />
      </div>
      {project.review_note && (
        <p className="liq-card mt-6 max-w-3xl border-l-4 border-accent p-4 text-sm text-body">
          <span className="font-semibold text-navy">{tDash('reviewNote')}: </span>
          {project.review_note}
        </p>
      )}
      <div className="mt-8">
        <ProjectWizard project={project} documents={documents} problems={problems} />
      </div>
    </Section>
  );
}
