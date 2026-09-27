/**
 * Datenzugriff für Emittenten-Profil, Projekt-Neuigkeiten und Fragen (Etappe 14).
 * Öffentliche Lesezugriffe über Session-/Anon-Client mit RLS; Moderation über service_role.
 */
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Localized } from '@/lib/projects/types';

export interface EmittentPublic {
  id: string;
  profile_slug: string;
  name: string;
  avatar_path: string | null;
  bio: Localized | null;
  website: string | null;
  verified: boolean;
  created_at: string;
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  title: Localized;
  body: Localized;
  hidden: boolean;
  created_at: string;
}

export interface ProjectQuestion {
  id: string;
  project_id: string;
  investor_id?: string;
  question: string;
  answer: string | null;
  answered_at: string | null;
  hidden?: boolean;
  created_at: string;
}

export async function getEmittentBySlug(slug: string): Promise<EmittentPublic | null> {
  const { data } = await createSupabaseServerClient().from('emittent_public').select('*').eq('profile_slug', slug).maybeSingle();
  return (data as EmittentPublic | null) ?? null;
}

export async function getEmittentById(id: string): Promise<EmittentPublic | null> {
  const { data } = await createSupabaseServerClient().from('emittent_public').select('*').eq('id', id).maybeSingle();
  return (data as EmittentPublic | null) ?? null;
}

export async function listProjectUpdates(projectId: string): Promise<ProjectUpdate[]> {
  const { data, error } = await createSupabaseServerClient()
    .from('project_updates')
    .select('id, project_id, title, body, hidden, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) console.error('[community] updates:', error.message);
  return (data ?? []) as ProjectUpdate[];
}

/** Öffentlich: nur beantwortete Fragen (RLS); Emittent: alle Fragen seiner Projekte. */
export async function listProjectQuestions(projectId: string, columns = 'id, project_id, question, answer, answered_at, created_at'): Promise<ProjectQuestion[]> {
  const { data, error } = await createSupabaseServerClient()
    .from('project_questions')
    .select(columns)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) console.error('[community] questions:', error.message);
  return (data ?? []) as unknown as ProjectQuestion[];
}
