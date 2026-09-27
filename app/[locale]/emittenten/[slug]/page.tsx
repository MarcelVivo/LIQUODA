import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { Globe, ShieldCheck } from 'lucide-react';
import Section, { SectionHeading } from '@/components/ui/Section';
import Badge from '@/components/ui/Badge';
import ProjectCard from '@/components/projects/ProjectCard';
import { getEmittentBySlug } from '@/lib/community';
import { getProjects } from '@/lib/projects';
import { imageUrl } from '@/lib/images';
import { formatDate } from '@/lib/format';

export async function generateMetadata({ params }: { params: { locale: string; slug: string } }): Promise<Metadata> {
  const e = await getEmittentBySlug(params.slug);
  return { title: e?.name ?? 'Emittent' };
}

/** Öffentliches Emittenten-Profil: Logo, Beschreibung, Website, Projekte. Keine Personendaten ausser dem Namen. */
export default async function EmittentProfilePage({ params }: { params: { slug: string } }) {
  const emittent = await getEmittentBySlug(params.slug);
  if (!emittent) notFound();
  const t = await getTranslations('community.profile');
  const locale = (await getLocale()) as 'de' | 'en';
  const projects = (await getProjects()).filter((p) => p.issuerName === emittent.name);
  const bio = emittent.bio ? emittent.bio[locale] || emittent.bio.de : '';

  return (
    <>
      <Section className="pt-28 sm:pt-32">
        <div className="flex flex-wrap items-start gap-6">
          {emittent.avatar_path && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl(emittent.avatar_path) ?? ''} alt="" className="h-24 w-24 rounded-2xl object-cover shadow-card" />
          )}
          <div className="min-w-0 flex-1">
            <SectionHeading as="h1" title={emittent.name} kicker={t('metaTitle')} />
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              {emittent.verified ? (
                <span className="inline-flex items-center gap-1.5 text-accent"><ShieldCheck size={16} aria-hidden="true" />{t('verified')}</span>
              ) : (
                <Badge label={t('notVerified')} variant="neutral" />
              )}
              {emittent.website && (
                <a href={emittent.website} target="_blank" rel="noopener nofollow" className="liq-link inline-flex items-center gap-1.5 text-navy"><Globe size={16} aria-hidden="true" />{t('website')}</a>
              )}
              <span className="text-muted">{t('since')} {formatDate(emittent.created_at.slice(0, 10), locale)}</span>
            </div>
          </div>
        </div>
        <div className="mt-8 max-w-3xl space-y-4 text-base leading-relaxed text-body">
          {bio ? bio.split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>) : <p className="text-muted">{t('noBio')}</p>}
        </div>
      </Section>
      <Section tone="white">
        <SectionHeading title={t('projects')} />
        {projects.length === 0 ? (
          <p className="mt-6 text-sm text-muted">{t('noProjects')}</p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </Section>
    </>
  );
}
