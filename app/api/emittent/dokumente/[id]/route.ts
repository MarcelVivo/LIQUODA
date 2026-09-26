import { NextResponse } from 'next/server';
import { requireEmittent } from '../../_lib';
import { deleteDocument, getDocumentById } from '@/lib/documents';

/** Dokument löschen: nur eigene Projekte im Entwurf. */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireEmittent();
  if ('error' in ctx) return ctx.error;

  const doc = await getDocumentById(params.id);
  if (!doc) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  // Eigentum und Status über den Session-Client prüfen (RLS)
  const { data: project } = await ctx.supabase.from('projects').select('id, status').eq('id', doc.project_id).maybeSingle();
  if (!project) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (project.status !== 'draft') return NextResponse.json({ error: 'locked' }, { status: 409 });

  const ok = await deleteDocument(doc);
  return ok ? NextResponse.json({ success: true }) : NextResponse.json({ error: 'server' }, { status: 500 });
}
