import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { Link, redirect } from '@/i18n/routing';
import Section, { SectionHeading } from '@/components/ui/Section';
import CommunicationPanel from '@/components/community/CommunicationPanel';
import { getAccount } from '@/lib/supabase/server';
import { getOwnProject } from '@/lib/emittent';
import { listProjectQuestions, listProjectUpdates } from '@/lib/community';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'emittent.dashboard' });
  return { title: t('communication') };
}

export default async function CommunicationPage({ params }: { params: { locale: string; id: string } }) {
  const account = await getAccount();
  if (!account) redirect({ href: '/login', locale: params.locale });
  if (account!.role !== 'emittent') redirect({ href: '/portfolio', locale: params.locale });
  const project = await getOwnProject(params.id);
  if (!project) notFound();
  const t = await getTranslations('emittent');
  const locale = (await getLocale()) as 'de' | 'en';
  const [updates, questions] = await Promise.all([
    listProjectUpdates(project.id),
    listProjectQuestions(project.id, 'id, project_id, question, answer, answered_at, created_at'),
  ]);
  const canPost = ['active', 'funded', 'failed', 'cancelled', 'closed'].includes(project.status);

  return (
    <Section className="pt-28 sm:pt-32">
      <Link href="/emittent" className="liq-link inline-flex items-center gap-1.5 text-sm text-muted"><ArrowLeft size={16} aria-hidden="true" />{t('wizard.back')}</Link>
      <div className="mt-6"><SectionHeading as="h1" title={t('dashboard.communication')} kicker={project.title[locale] || project.title.de} /></div>
      <div className="mt-10"><CommunicationPanel projectId={project.id} canPost={canPost} updates={updates} questions={questions} /></div>
    </Section>
  );
}
