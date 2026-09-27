import { NextResponse } from 'next/server';
import { requireEmittent } from '../../../_lib';
import { getOwnProject, listProjectDocuments } from '@/lib/emittent';
import { submitProject } from '@/lib/emittent-actions';

/** Entwurf zur Prüfung einreichen: draft -> in_review (Spec, Abschnitt 4, Emittent Schritt 5). */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireEmittent();
  if ('error' in ctx) return ctx.error;

  const project = await getOwnProject(params.id);
  if (!project) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const documents = await listProjectDocuments(project.id);
  const result = await submitProject(ctx.supabase, project, documents);
  if (!result.ok) {
    const status = result.error === 'locked' ? 409 : result.error === 'incomplete' ? 400 : 500;
    return NextResponse.json({ error: result.error, problems: result.problems }, { status });
  }
  return NextResponse.json({ success: true, slug: result.slug });
}
