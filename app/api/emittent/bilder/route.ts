import { NextRequest, NextResponse } from 'next/server';
import { cleanText, requireEmittent } from '../_lib';
import { GALLERY_MAX, IMAGE_MIME, IMAGE_MAX_BYTES, removeImage, storeImage } from '@/lib/images';

/** Projektbilder: Titelbild (Pflicht, ersetzt das bisherige) oder Galerie (bis 4). Nur eigene Projekte im Entwurf. */
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
  const kind = cleanText(form.get('kind'), 10);
  const file = form.get('file');
  if (!projectId || !['cover', 'gallery'].includes(kind) || !(file instanceof File)) {
    return NextResponse.json({ error: 'validation' }, { status: 400 });
  }
  if (!IMAGE_MIME[file.type]) return NextResponse.json({ error: 'file_type' }, { status: 400 });
  if (file.size > IMAGE_MAX_BYTES) return NextResponse.json({ error: 'file_size' }, { status: 400 });

  const { data: project } = await ctx.supabase
    .from('projects')
    .select('id, status, cover_image_path, gallery_paths')
    .eq('id', projectId)
    .maybeSingle();
  if (!project) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (project.status !== 'draft') return NextResponse.json({ error: 'locked' }, { status: 409 });
  const gallery: string[] = project.gallery_paths ?? [];
  if (kind === 'gallery' && gallery.length >= GALLERY_MAX) return NextResponse.json({ error: 'gallery_full' }, { status: 400 });

  const stored = await storeImage(projectId, file);
  if (!stored.ok) return NextResponse.json({ error: stored.error }, { status: stored.error === 'upload' ? 500 : 400 });

  const update = kind === 'cover' ? { cover_image_path: stored.path } : { gallery_paths: [...gallery, stored.path] };
  const { error } = await ctx.supabase.from('projects').update(update).eq('id', projectId);
  if (error) {
    await removeImage(stored.path);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
  if (kind === 'cover') await removeImage(project.cover_image_path);
  return NextResponse.json({ success: true, path: stored.path });
}

export async function DELETE(req: NextRequest) {
  const ctx = await requireEmittent();
  if ('error' in ctx) return ctx.error;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const projectId = cleanText(body.projectId, 36);
  const path = cleanText(body.path, 200);
  if (!projectId || !path || !path.startsWith(`${projectId}/`)) return NextResponse.json({ error: 'validation' }, { status: 400 });

  const { data: project } = await ctx.supabase
    .from('projects')
    .select('id, status, cover_image_path, gallery_paths')
    .eq('id', projectId)
    .maybeSingle();
  if (!project) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (project.status !== 'draft') return NextResponse.json({ error: 'locked' }, { status: 409 });

  const update =
    project.cover_image_path === path
      ? { cover_image_path: null }
      : { gallery_paths: (project.gallery_paths ?? []).filter((p: string) => p !== path) };
  const { error } = await ctx.supabase.from('projects').update(update).eq('id', projectId);
  if (error) return NextResponse.json({ error: 'server' }, { status: 500 });
  await removeImage(path);
  return NextResponse.json({ success: true });
}
