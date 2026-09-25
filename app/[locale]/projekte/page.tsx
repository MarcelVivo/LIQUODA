import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { Info } from 'lucide-react';
import { Link } from '@/i18n/routing';
import Section, { SectionHeading } from '@/components/ui/Section';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectFilters from '@/components/projects/ProjectFilters';
import { getProjects, isAssetType, isPublicStatus } from '@/lib/projects';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'projects' });
  return { title: t('metaTitle'), description: t('metaDescription') };
}

// Marktplatz (Spec, Abschnitt 3): alle aktiven Projekte, Filter nach
// Asset-Typ und Status. Daten in Etappe 2 aus lib/projects.ts.
export default function ProjectsPage({
  searchParams,
}: {
  searchParams: { asset?: string; status?: string };
}) {
  const t = useTranslations('projects');
  const assetType = isAssetType(searchParams.asset) ? searchParams.asset : undefined;
  const status = isPublicStatus(searchParams.status) ? searchParams.status : undefined;
  const projects = getProjects({ assetType, status });
  const filtered = !!(assetType || status);

  return (
    <>
      <Section className="pt-28 sm:pt-32" ariaLabel={t('title')}>
        <SectionHeading as="h1" title={t('title')} lead={t('lead')} />
        <div className="mt-6 flex max-w-3xl gap-3 rounded-xl border border-navy/10 bg-white/70 px-4 py-3 text-sm text-muted">
          <Info size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
          <p>{t('exampleNote')}</p>
        </div>
      </Section>

      <Section tone="white" className="pt-0 sm:pt-0" ariaLabel={t('filterAsset')}>
        <div className="liq-card p-6">
          <ProjectFilters assetType={assetType} status={status} />
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-navy" aria-live="polite">
            {t('count', { count: projects.length })}
          </p>
          {filtered && (
            <Link href="/projekte" className="liq-link text-sm text-muted">
              {t('reset')}
            </Link>
          )}
        </div>

        {projects.length === 0 ? (
          <p className="mt-6 rounded-2xl bg-white p-8 text-center text-sm text-muted shadow-card">{t('empty')}</p>
        ) : (
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
