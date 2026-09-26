import { NextResponse } from 'next/server';
import { requireEmittent, slugify, randomSuffix } from '../../../_lib';
import { getOwnProject, listProjectDocuments, submissionProblems } from '@/lib/emittent';

/** Entwurf zur Prüfung einreichen: draft -> in_review (Spec, Abschnitt 4, Emittent Schritt 5). */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireEmittent();
  if ('error' in ctx) return ctx.error;

  const project = await getOwnProject(params.id);
  if (!project) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (project.status !== 'draft') return NextResponse.json({ error: 'locked' }, { status: 409 });

  const documents = await listProjectDocuments(project.id);
  const problems = submissionProblems(project, documents);
  if (problems.length) return NextResponse.json({ error: 'incomplete', problems }, { status: 400 });

  // Sprechender Slug aus dem Titel, eindeutig durch Suffix
  const base = slugify(project.title.de) || 'projekt';
  const slug = project.slug.startsWith('projekt-') ? `${base}-${randomSuffix()}` : project.slug;

  const { error } = await ctx.supabase
    .from('projects')
    .update({ status: 'in_review', slug })
    .eq('id', project.id)
    .eq('status', 'draft');
  if (error) {
    console.error('[emittent/einreichen]', error.message);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
  return NextResponse.json({ success: true, slug });
}
