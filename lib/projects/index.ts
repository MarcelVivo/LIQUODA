/**
 * Datenzugriff für den Marktplatz. Liest ab Etappe 3 aus Supabase
 * (View «project_public» und Tabelle «documents», beide per RLS öffentlich).
 * Fehlt der Anon-Key lokal, werden die Beispieldaten verwendet.
 */
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { exampleProjects } from './example-data';
import {
  publicStatus,
  type AssetType,
  type Project,
  type ProjectDocument,
  type PublicStatus,
} from './types';

export * from './types';

type ProjectRow = {
  id: string;
  slug: string;
  title: Project['title'];
  summary: Project['summary'];
  description: { de: string[]; en?: string[] }; // in der DB pro Sprache ein Array von Absätzen
  purpose: Project['purpose'];
  location: Project['location'];
  risks: { de: string[]; en?: string[] };
  asset_type: Project['assetType'];
  target_amount_chf: number | string;
  min_investment_chf: number | string;
  raised_amount_chf: number | string;
  deadline: string;
  status: Project['status'];
  token_model: Project['tokenModel'];
  issuer_name: string;
};

type DocumentRow = {
  id: string;
  project_id: string;
  type: ProjectDocument['type'];
  title: ProjectDocument['title'];
  version: number;
  created_at: string;
};

const FEATURED_SLUGS = ['pizzeria-wander-bern', 'mehrfamilienhaus-vera-thun', 'display-solutions-ag'];

let warned = false;
function shouldUseFallback(): boolean {
  if (hasSupabaseEnv()) return false;
  if (!warned) {
    warned = true;
    console.warn('[projects] NEXT_PUBLIC_SUPABASE_ANON_KEY fehlt, Marktplatz nutzt Beispieldaten.');
  }
  return true;
}

/** {de: [...], en: [...]} aus der Datenbank -> [{de, en}, ...] wie im Frontend verwendet */
function toLocalizedList(value: { de: string[]; en?: string[] }): Project['description'] {
  return (value?.de ?? []).map((de, i) => ({ de, en: value.en?.[i] ?? de }));
}

function toProject(row: ProjectRow, docs: DocumentRow[]): Project {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    issuerName: row.issuer_name,
    location: row.location,
    assetType: row.asset_type,
    summary: row.summary,
    description: toLocalizedList(row.description),
    purpose: row.purpose,
    targetAmountChf: Number(row.target_amount_chf),
    raisedAmountChf: Number(row.raised_amount_chf),
    minInvestmentChf: Number(row.min_investment_chf),
    deadline: row.deadline,
    status: row.status,
    tokenModel: row.token_model,
    documents: docs
      .filter((d) => d.project_id === row.id)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((d) => ({
        id: d.id,
        type: d.type,
        title: d.title,
        version: d.version,
        date: d.created_at.slice(0, 10),
      })),
    risks: toLocalizedList(row.risks),
  };
}

async function loadDocuments(projectIds: string[]): Promise<DocumentRow[]> {
  if (projectIds.length === 0) return [];
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('documents')
    .select('id, project_id, type, title, version, created_at')
    .in('project_id', projectIds)
    .is('investment_id', null);
  if (error) {
    console.error('[projects] documents:', error.message);
    return [];
  }
  return (data ?? []) as DocumentRow[];
}

/** Öffentlich sichtbare Projekte, optional gefiltert. */
export async function getProjects(
  filter: { assetType?: AssetType; status?: PublicStatus } = {}
): Promise<Project[]> {
  if (shouldUseFallback()) {
    return exampleProjects.filter((p) => {
      const status = publicStatus(p);
      if (!status) return false;
      if (filter.assetType && p.assetType !== filter.assetType) return false;
      if (filter.status && status !== filter.status) return false;
      return true;
    });
  }

  const supabase = createSupabaseServerClient();
  let query = supabase.from('project_public').select('*').order('created_at', { ascending: false });
  if (filter.assetType) query = query.eq('asset_type', filter.assetType);
  if (filter.status === 'open') query = query.eq('status', 'active');
  if (filter.status === 'funded') query = query.eq('status', 'funded');
  if (filter.status === 'closed') query = query.in('status', ['failed', 'cancelled', 'closed']);

  const { data, error } = await query;
  if (error) {
    console.error('[projects] list:', error.message);
    return [];
  }
  const rows = (data ?? []) as ProjectRow[];
  const docs = await loadDocuments(rows.map((r) => r.id));
  return rows.map((r) => toProject(r, docs));
}

export async function getProjectBySlug(slug: string): Promise<Project | undefined> {
  if (shouldUseFallback()) {
    const project = exampleProjects.find((p) => p.slug === slug);
    return project && publicStatus(project) ? project : undefined;
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('project_public').select('*').eq('slug', slug).maybeSingle();
  if (error) {
    console.error('[projects] detail:', error.message);
    return undefined;
  }
  if (!data) return undefined;
  const row = data as ProjectRow;
  const docs = await loadDocuments([row.id]);
  return toProject(row, docs);
}

/** Die drei Projekte für die Vorschau auf der Startseite. */
export async function getFeaturedProjects(): Promise<Project[]> {
  const all = await getProjects();
  const featured = FEATURED_SLUGS.map((slug) => all.find((p) => p.slug === slug)).filter(
    (p): p is Project => !!p
  );
  return featured.length > 0 ? featured : all.slice(0, 3);
}
