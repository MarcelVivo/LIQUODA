import { NextRequest, NextResponse } from 'next/server';
import { requireEmittent } from '../_lib';
import { getSupabaseAdmin } from '@/lib/supabase';
import { IMAGE_MIME, IMAGE_MAX_BYTES, removeImage, storeImage } from '@/lib/images';

/** Logo oder Porträt des Emittenten (freiwillig), sichtbar auf den Projektseiten. */
export async function POST(req: NextRequest) {
  const ctx = await requireEmittent();
  if ('error' in ctx) return ctx.error;
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'invalid_form' }, { status: 400 });
  }
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'validation' }, { status: 400 });
  if (!IMAGE_MIME[file.type]) return NextResponse.json({ error: 'file_type' }, { status: 400 });
  if (file.size > IMAGE_MAX_BYTES) return NextResponse.json({ error: 'file_size' }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { data: current } = await admin.from('users').select('avatar_path').eq('id', ctx.profile.id).maybeSingle();
  const stored = await storeImage(`avatars/${ctx.profile.id}`, file);
  if (!stored.ok) return NextResponse.json({ error: stored.error }, { status: stored.error === 'upload' ? 500 : 400 });
  const { error } = await admin.from('users').update({ avatar_path: stored.path }).eq('id', ctx.profile.id);
  if (error) {
    await removeImage(stored.path);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
  await removeImage(current?.avatar_path);
  return NextResponse.json({ success: true, path: stored.path });
}

export async function DELETE() {
  const ctx = await requireEmittent();
  if ('error' in ctx) return ctx.error;
  const admin = getSupabaseAdmin();
  const { data: current } = await admin.from('users').select('avatar_path').eq('id', ctx.profile.id).maybeSingle();
  await admin.from('users').update({ avatar_path: null }).eq('id', ctx.profile.id);
  await removeImage(current?.avatar_path);
  return NextResponse.json({ success: true });
}
