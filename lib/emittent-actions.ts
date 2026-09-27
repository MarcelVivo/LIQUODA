/**
 * Gemeinsame Projekt-Aktionen für den Wizard (Route Handler) und den
 * KI-Assistenten: Validierung eines Entwurfs-Updates und das Einreichen.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { MAX_INVESTMENT_CHF } from '@/lib/fees';
import { COLLATERAL_TYPES } from '@/lib/projects/types';
import type { OwnProject } from '@/lib/emittent';
import type { DocumentRecord } from '@/lib/documents';
import { submissionProblems } from '@/lib/emittent';
import { notifyProjectSubmitted } from '@/lib/email/notify';
import { cleanLocalized, cleanLocalizedList, cleanText, isAssetType, isTokenModel, MIN_INVESTMENT_FLOOR_CHF, MIN_TARGET_CHF, randomSuffix, slugify } from '@/app/api/emittent/_lib';

/** Felder eines Entwurfs prüfen und in Datenbank-Spalten übersetzen. */
export function validateProjectUpdate(body: Record<string, unknown>): { update: Record<string, unknown>; fields: string[] } {
  const update: Record<string, unknown> = {};
  const fields: string[] = [];

  if ('title' in body) update.title = cleanLocalized(body.title, 120);
  if ('summary' in body) update.summary = cleanLocalized(body.summary, 300);
  if ('purpose' in body) update.purpose = cleanLocalized(body.purpose, 300);
  if ('location' in body) update.location = cleanLocalized(body.location, 120);
  if ('description' in body) update.description = cleanLocalizedList(body.description, 12, 1500);
  if ('risks' in body) update.risks = cleanLocalizedList(body.risks, 12, 400);
  if ('assetType' in body) {
    if (isAssetType(body.assetType)) update.asset_type = body.assetType;
    else fields.push('assetType');
  }
  if ('tokenModel' in body) {
    if (isTokenModel(body.tokenModel)) update.token_model = body.tokenModel;
    else fields.push('tokenModel');
  }
  if ('targetAmountChf' in body) {
    const n = Number(body.targetAmountChf);
    if (Number.isInteger(n) && n >= MIN_TARGET_CHF && n <= 100_000_000) update.target_amount_chf = n;
    else fields.push('targetAmountChf');
  }
  if ('minInvestmentChf' in body) {
    const n = Number(body.minInvestmentChf);
    if (Number.isInteger(n) && n >= MIN_INVESTMENT_FLOOR_CHF && n <= MAX_INVESTMENT_CHF) update.min_investment_chf = n;
    else fields.push('minInvestmentChf');
  }
  if ('collateralType' in body) {
    if (typeof body.collateralType === 'string' && (COLLATERAL_TYPES as readonly string[]).includes(body.collateralType)) update.collateral_type = body.collateralType;
    else fields.push('collateralType');
  }
  if ('collateralNote' in body) update.collateral_note = cleanText(body.collateralNote, 1000) || null;
  if ('deadline' in body) {
    const s = typeof body.deadline === 'string' ? body.deadline : '';
    const d = new Date(`${s}T00:00:00`);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(d.getTime()) && d > new Date()) update.deadline = s;
    else fields.push('deadline');
  }
  return { update, fields };
}

/** Entwurf zur Prüfung einreichen: draft -> in_review, sprechender Slug, Mail an Kapitalnehmer und Admin. */
export async function submitProject(
  client: SupabaseClient,
  project: OwnProject,
  documents: DocumentRecord[]
): Promise<{ ok: true; slug: string } | { ok: false; error: 'locked' | 'incomplete' | 'server'; problems?: string[] }> {
  if (project.status !== 'draft') return { ok: false, error: 'locked' };
  const problems = submissionProblems(project, documents);
  if (problems.length) return { ok: false, error: 'incomplete', problems };

  const base = slugify(project.title.de) || 'projekt';
  const slug = project.slug.startsWith('projekt-') ? `${base}-${randomSuffix()}` : project.slug;

  const { error } = await client.from('projects').update({ status: 'in_review', slug }).eq('id', project.id).eq('status', 'draft');
  if (error) {
    console.error('[emittent/einreichen]', error.message);
    return { ok: false, error: 'server' };
  }
  notifyProjectSubmitted(project.id).catch((e) => console.error('[email]', e));
  return { ok: true, slug };
}
