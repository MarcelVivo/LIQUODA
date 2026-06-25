import { useTranslations } from 'next-intl';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

interface Project {
  nameKey: string;
  categoryKey: string;
  goalCHF: string;
  fundedPercent: number;
}

const projects: Project[] = [
  {
    nameKey: 'p1Name',
    categoryKey: 'p1Category',
    goalCHF: "30'000",
    fundedPercent: 67,
  },
  {
    nameKey: 'p2Name',
    categoryKey: 'p2Category',
    goalCHF: "600'000",
    fundedPercent: 23,
  },
  {
    nameKey: 'p3Name',
    categoryKey: 'p3Category',
    goalCHF: "100'000",
    fundedPercent: 45,
  },
];

function ProjectCard({ project }: { project: Project }) {
  const t = useTranslations('projects');

  return (
    <article className="flex flex-col rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      {/* Category badge + active badge */}
      <div className="flex items-center justify-between">
        <Badge label={t(project.categoryKey as any)} variant="neutral" />
        <Badge label={t('badgeActive')} variant="active" />
      </div>

      {/* Project name */}
      <h3 className="mt-4 text-base font-semibold text-navy">{t(project.nameKey as any)}</h3>

      {/* Progress section */}
      <div className="mt-4 flex-1">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>{project.fundedPercent}% {t('funded')}</span>
          <span>{t('goal')}: CHF {project.goalCHF}</span>
        </div>
        {/* Progress bar */}
        <div className="h-2 w-full rounded-full bg-gray-100">
          <div
            className="h-2 rounded-full bg-navy"
            style={{ width: `${project.fundedPercent}%` }}
            role="progressbar"
            aria-valuenow={project.fundedPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${project.fundedPercent}% ${t('funded')}`}
          />
        </div>
      </div>

      {/* CTA */}
      <div className="mt-6">
        <Button
          variant="outline"
          size="sm"
          fullWidth
          disabled
          title={t('comingSoon')}
        >
          {t('learnMore')}
        </Button>
      </div>
    </article>
  );
}

export default function ProjectPreview() {
  const t = useTranslations('projects');

  return (
    <section id="projects" className="bg-white py-24" aria-label="Current projects">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
          {t('title')}
        </h2>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.nameKey} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}
