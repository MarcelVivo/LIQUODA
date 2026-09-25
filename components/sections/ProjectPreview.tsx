import { useTranslations } from 'next-intl';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Section, { SectionHeading } from '@/components/ui/Section';

interface Project {
  nameKey: 'p1Name' | 'p2Name' | 'p3Name';
  categoryKey: 'p1Category' | 'p2Category' | 'p3Category';
  goalCHF: string;
  fundedPercent: number;
}

// Beispieldaten. Der Marktplatz mit echten Projektdaten folgt in Etappe 2.
const projects: Project[] = [
  { nameKey: 'p1Name', categoryKey: 'p1Category', goalCHF: "30'000", fundedPercent: 67 },
  { nameKey: 'p2Name', categoryKey: 'p2Category', goalCHF: "600'000", fundedPercent: 23 },
  { nameKey: 'p3Name', categoryKey: 'p3Category', goalCHF: "100'000", fundedPercent: 45 },
];

function ProjectCard({ project }: { project: Project }) {
  const t = useTranslations('home.examples');

  return (
    <article className="flex flex-col liq-card liq-card-hover p-6">
      <div className="flex items-center justify-between gap-2">
        <Badge label={t(project.categoryKey)} variant="neutral" />
        <Badge label={t('badgeExample')} variant="info" />
      </div>

      <h3 className="mt-4 text-base font-semibold text-navy">{t(project.nameKey)}</h3>
      <p className="mt-1 text-xs text-muted">{t('statusOpen')}</p>

      <div className="mt-5 flex-1">
        <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
          <span>
            {project.fundedPercent} % {t('funded')}
          </span>
          <span>
            {t('goal')}: CHF {project.goalCHF}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-cream-dark">
          <div
            className="h-2 rounded-full bg-accent"
            style={{ width: `${project.fundedPercent}%` }}
            role="progressbar"
            aria-valuenow={project.fundedPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${project.fundedPercent} % ${t('funded')}`}
          />
        </div>
      </div>

      <div className="mt-6">
        <Button variant="outline" size="sm" fullWidth disabled>
          {t('detailsSoon')}
        </Button>
      </div>
    </article>
  );
}

export default function ProjectPreview() {
  const t = useTranslations('home.examples');

  return (
    <Section id="beispielprojekte" ariaLabel={t('title')}>
      <SectionHeading title={t('title')} lead={t('lead')} />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.nameKey} project={project} />
        ))}
      </div>
    </Section>
  );
}
