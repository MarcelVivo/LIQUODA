/**
 * Datenzugriff für das Emittenten-Dashboard. Läuft über den Session-Client,
 * RLS und Spaltenrechte der Datenbank gelten (nur eigene Projekte, nur fachliche Felder).
 */
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { AssetType, CollateralType, Localized, ProjectStatus, TokenModel } from '@/lib/projects/types';
import type { DocumentRecord } from '@/lib/documents';

export interface OwnProject {
  id: string;
  slug: string;
  title: Localized;
  summary: Localized;
  description: { de: string[]; en?: string[] };
  purpose: Localized;
  location: Localized;
  risks: { de: string[]; en?: string[] };
  asset_type: AssetType;
  target_amount_chf: number | string;
  min_investment_chf: number | string;
  raised_amount_chf: number | string;
  deadline: string;
  status: ProjectStatus;
  token_model: TokenModel;
  collateral_type: CollateralType;
  collateral_note: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
}

const COLUMNS =
  'id, slug, title, summary, description, purpose, location, risks, asset_type, target_amount_chf, min_investment_chf, raised_amount_chf, deadline, status, token_model, collateral_type, collateral_note, review_note, created_at, updated_at';

export async function listOwnProjects(): Promise<OwnProject[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('projects')
    .select(COLUMNS)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[emittent] list:', error.message);
    return [];
  }
  return (data ?? []) as OwnProject[];
}

export async function getOwnProject(id: string): Promise<OwnProject | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('projects').select(COLUMNS).eq('id', id).maybeSingle();
  if (error) {
    console.error('[emittent] detail:', error.message);
    return null;
  }
  return (data as OwnProject | null) ?? null;
}

export async function listProjectDocuments(projectId: string): Promise<DocumentRecord[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('project_id', projectId)
    .is('investment_id', null)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('[emittent] documents:', error.message);
    return [];
  }
  return (data ?? []) as DocumentRecord[];
}

/** Bearbeitbar nur im Entwurf; in Prüfung ist das Projekt eingefroren. */
export function isEditable(project: Pick<OwnProject, 'status'>): boolean {
  return project.status === 'draft';
}

/** Vollständigkeit vor dem Einreichen (Spec: Informationen, Dokumente, Zielbetrag, Laufzeit). */
export function submissionProblems(project: OwnProject, documents: DocumentRecord[]): string[] {
  const problems: string[] = [];
  const has = (v: Localized | undefined) => !!v?.de?.trim();
  if (!has(project.title)) problems.push('title');
  if (!has(project.summary)) problems.push('summary');
  if (!(project.description?.de?.length > 0 && project.description.de.every((p) => p.trim()))) problems.push('description');
  if (!has(project.purpose)) problems.push('purpose');
  if (!has(project.location)) problems.push('location');
  if (Number(project.target_amount_chf) <= 0) problems.push('target');
  if (Number(project.min_investment_chf) <= 0 || Number(project.min_investment_chf) > Number(project.target_amount_chf)) problems.push('min');
  if (!project.deadline || new Date(project.deadline) <= new Date()) problems.push('deadline');
  if (project.collateral_type !== 'none' && !project.collateral_note?.trim()) problems.push('collateral');
  if (documents.length === 0) problems.push('documents');
  return problems;
}
