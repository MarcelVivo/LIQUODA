import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import Section, { SectionHeading } from '@/components/ui/Section';
import ProjectCard from '@/components/projects/ProjectCard';
import { getFeaturedProjects } from '@/lib/projects';

export default function ProjectPreview() {
  const t = useTranslations('home.examples');
  const projects = getFeaturedProjects();

  return (
    <Section id="beispielprojekte" ariaLabel={t('title')}>
      <SectionHeading title={t('title')} lead={t('lead')} />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
      <Link
        href="/projekte"
        className="liq-link mt-10 inline-flex items-center gap-1.5 text-sm font-semibold text-navy"
      >
        {t('all')}
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </Section>
  );
}
