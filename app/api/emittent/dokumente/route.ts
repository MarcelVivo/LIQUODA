import { NextRequest, NextResponse } from 'next/server';
import { cleanText, requireEmittent } from '../_lib';
import { DOCUMENT_MAX_BYTES, DOCUMENT_MIME, DOCUMENT_TYPES, storeDocument } from '@/lib/documents';
import type { DocumentType } from '@/lib/projects/types';

/** Dokument hochladen (multipart): nur eigene Projekte im Entwurf. */
export async function POST(req: NextRequest) {
  const ctx = await requireEmittent();
  if ('error' in ctx) return ctx.error;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'invalid_form' }, { status: 400 });
  }

  const projectId = cleanText(form.get('projectId'), 36);
  const type = cleanText(form.get('type'), 20) as DocumentType;
  const titleDe = cleanText(form.get('titleDe'), 160);
  const titleEn = cleanText(form.get('titleEn'), 160) || titleDe;
  const file = form.get('file');

  const fields: string[] = [];
  if (!projectId) fields.push('projectId');
  if (!DOCUMENT_TYPES.includes(type)) fields.push('type');
  if (!titleDe) fields.push('titleDe');
  if (!(file instanceof File)) fields.push('file');
  if (fields.length) return NextResponse.json({ error: 'validation', fields }, { status: 400 });

  const f = file as File;
  if (!DOCUMENT_MIME[f.type]) return NextResponse.json({ error: 'file_type' }, { status: 400 });
  if (f.size > DOCUMENT_MAX_BYTES) return NextResponse.json({ error: 'file_size' }, { status: 400 });

  const { data: project } = await ctx.supabase.from('projects').select('id, status').eq('id', projectId).maybeSingle();
  if (!project) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (project.status !== 'draft') return NextResponse.json({ error: 'locked' }, { status: 409 });

  const result = await storeDocument({ projectId, type, title: { de: titleDe, en: titleEn }, file: f });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.error === 'server' ? 500 : 400 });
  return NextResponse.json({ success: true, document: result.document });
}
