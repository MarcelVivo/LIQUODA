import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import Badge from '@/components/ui/Badge';
import StatusBadge from '@/components/projects/StatusBadge';
import ProgressBar from '@/components/projects/ProgressBar';
import { formatChf, formatDate } from '@/lib/format';
import { progressPercent, publicStatus, type Locale, type Project } from '@/lib/projects';

export default function ProjectCard({ project }: { project: Project }) {
  const locale = useLocale() as Locale;
  const t = useTranslations('projects');
  const status = publicStatus(project);
  const percent = progressPercent(project);

  return (
    <article className="liq-card liq-card-hover flex flex-col p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge label={t(`assetTypes.${project.assetType}`)} variant="neutral" />
        {status && <StatusBadge status={status} />}
        <Badge label={t('card.example')} variant="info" className="ml-auto" />
      </div>

      <h3 className="mt-4 text-lg font-bold text-navy">{project.title[locale]}</h3>
      <p className="mt-0.5 text-xs text-muted">{project.location[locale]}</p>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{project.summary[locale]}</p>

      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
          <span>
            {percent} % {t('card.raised')}
          </span>
          <span>
            {t('card.target')}: {formatChf(project.targetAmountChf)}
          </span>
        </div>
        <ProgressBar percent={percent} label={`${percent} % ${t('card.raised')}`} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="text-muted">{t('card.minInvestment')}</dt>
          <dd className="font-semibold text-navy">{formatChf(project.minInvestmentChf)}</dd>
        </div>
        <div>
          <dt className="text-muted">{t('card.deadline')}</dt>
          <dd className="font-semibold text-navy">{formatDate(project.deadline, locale)}</dd>
        </div>
      </dl>

      <Link
        href={`/projekte/${project.slug}`}
        className="liq-link mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-navy"
      >
        {t('card.details')}
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </article>
  );
}
