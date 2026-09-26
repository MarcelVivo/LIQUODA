import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/routing';
import Section from '@/components/ui/Section';
import Badge from '@/components/ui/Badge';
import Button, { ButtonLink } from '@/components/ui/Button';
import StatusBadge from '@/components/projects/StatusBadge';
import ProgressBar from '@/components/projects/ProgressBar';
import DocumentList from '@/components/projects/DocumentList';
import RiskNotes from '@/components/projects/RiskNotes';
import { daysUntil, formatChf, formatDate } from '@/lib/format';
import { getAccount } from '@/lib/supabase/server';
import { explorerToken } from '@/lib/chain/config';
import { getProjectBySlug, progressPercent, publicStatus, type Locale } from '@/lib/projects';

type Params = { locale: string; slug: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const project = await getProjectBySlug(params.slug);
  if (!project) return {};
  const locale = (params.locale === 'en' ? 'en' : 'de') as Locale;
  return { title: project.title[locale], description: project.summary[locale] };
}

// Projektseite (Spec, Abschnitt 3): Beschreibung, Asset, Zielbetrag, Fortschritt,
// Laufzeit, Dokumente, «Risiken & Hinweise», CTA «Investition prüfen».
export default async function ProjectPage({ params }: { params: Params }) {
  const project = await getProjectBySlug(params.slug);
  if (!project) notFound();

  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('projects');
  const status = publicStatus(project)!;
  const percent = progressPercent(project);
  const days = daysUntil(project.deadline);
  const statusNoteKey = project.status === 'failed' ? 'failed' : status;
  const investable = status === 'open' && days >= 0;
  const account = await getAccount();

  return (
    <>
      <Section className="pt-28 sm:pt-32" ariaLabel={project.title[locale]}>
        <Link href="/projekte" className="liq-link inline-flex items-center gap-1.5 text-sm text-muted">
          <ArrowLeft size={16} aria-hidden="true" />
          {t('detail.back')}
        </Link>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Badge label={t(`assetTypes.${project.assetType}`)} variant="neutral" />
          <StatusBadge status={status} />
          <Badge label={t(project.collateralType === 'none' ? 'collateral.badgeUnsecured' : 'collateral.badgeSecured')} variant={project.collateralType === 'none' ? 'neutral' : 'active'} />
          <Badge label={t('card.example')} variant="info" />
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl lg:text-5xl">
          {project.title[locale]}
        </h1>
        <p className="mt-3 text-sm text-muted">
          {t('detail.issuer')}: <span className="font-semibold text-navy">{project.issuerName}</span> ·{' '}
          {project.location[locale]}
        </p>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-body sm:text-lg">{project.summary[locale]}</p>
      </Section>

      <Section id="risiken" tone="white" className="pt-0 sm:pt-0" ariaLabel={t('detail.keyFigures')}>
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Inhalt */}
          <div className="space-y-10">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-navy">{t('detail.description')}</h2>
              <div className="mt-3 space-y-4 text-sm leading-relaxed text-body sm:text-base">
                {project.description.map((p) => (
                  <p key={p[locale]}>{p[locale]}</p>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-navy">{t('detail.purpose')}</h2>
              <p className="mt-3 text-sm leading-relaxed text-body sm:text-base">{project.purpose[locale]}</p>
            </div>

            <div className="liq-card p-6 sm:p-8">
              <h2 className="text-xl font-extrabold tracking-tight text-navy">{t('collateral.title')}</h2>
              <p className="mt-3 text-sm font-semibold text-navy">{t(`collateral.types.${project.collateralType}`)}</p>
              <p className="mt-1 text-sm leading-relaxed text-body">{t(`collateral.explain.${project.collateralType}`)}</p>
              {project.collateralNote && <p className="mt-3 rounded-lg bg-cream px-3 py-2.5 text-sm leading-relaxed text-body">{project.collateralNote}</p>}
              <p className="mt-4 border-t border-navy/10 pt-3 text-xs leading-relaxed text-muted">{t('collateral.disclaimer')}</p>
            </div>

            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-navy">{t('detail.documents')}</h2>
              <div className="mt-3">
                <DocumentList documents={project.documents} canDownload={!!account} />
              </div>
            </div>

            <RiskNotes projectRisks={project.risks} />
          </div>

          {/* Eckdaten und CTA */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="liq-card p-6">
              <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-accent">{t('detail.keyFigures')}</h2>

              <div className="mt-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-navy">{formatChf(project.raisedAmountChf)}</span>
                  <span className="text-xs text-muted">{t('detail.ofTarget', { percent })}</span>
                </div>
                <div className="mt-2">
                  <ProgressBar percent={percent} label={t('detail.ofTarget', { percent })} />
                </div>
              </div>

              <dl className="mt-5 space-y-3 border-t border-navy/10 pt-5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">{t('detail.target')}</dt>
                  <dd className="font-semibold text-navy">{formatChf(project.targetAmountChf)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">{t('detail.minInvestment')}</dt>
                  <dd className="font-semibold text-navy">{formatChf(project.minInvestmentChf)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">{t('detail.deadline')}</dt>
                  <dd className="text-right font-semibold text-navy">
                    {formatDate(project.deadline, locale)}
                    <span className="block text-xs font-normal text-muted">
                      {status === 'open' && days >= 0 ? t('detail.daysLeft', { days }) : t('detail.ended')}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">{t('detail.tokenModel')}</dt>
                  <dd className="text-right font-semibold text-navy">{t(`detail.tokenModels.${project.tokenModel}`)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">{t('detail.tokenContract')}</dt>
                  <dd className="text-right text-xs">
                    {project.tokenContractAddress ? (
                      <a href={explorerToken(project.tokenContractAddress)} target="_blank" rel="noopener" className="liq-link font-mono font-semibold text-navy" title={t('detail.tokenContractHint')}>
                        {project.tokenSymbol ?? project.tokenContractAddress.slice(0, 10)}
                      </a>
                    ) : (
                      <span className="text-muted">{t('detail.tokenContractNone')}</span>
                    )}
                  </dd>
                </div>
              </dl>

              <p className="mt-5 rounded-lg bg-cream px-3 py-2.5 text-xs leading-relaxed text-muted" role="status">
                {t(`detail.statusNotes.${statusNoteKey}`)}
              </p>

              <div className="mt-5">
                {investable ? (
                  <>
                    <ButtonLink href={`/investieren/${project.slug}`} size="lg" fullWidth aria-describedby="cta-hint">
                      {t('detail.ctaCheck')}
                    </ButtonLink>
                    {!account && (
                      <p id="cta-hint" className="mt-3 text-xs leading-relaxed text-muted">
                        {t('detail.ctaHintLogin')}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <Button size="lg" fullWidth disabled aria-describedby="cta-hint">
                      {t('detail.ctaCheck')}
                    </Button>
                    <p id="cta-hint" className="mt-3 text-xs leading-relaxed text-muted">
                      {t('detail.ctaHintClosed')}
                    </p>
                  </>
                )}
              </div>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
