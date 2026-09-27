import { NextRequest, NextResponse } from 'next/server';
import { cleanLocalized, cleanLocalizedList, cleanText, requireEmittent } from '../_lib';
import { notifyProjectUpdate } from '@/lib/email/notify';

/** Neuigkeit veröffentlichen (RLS: nur eigene, freigegebene Projekte) und an Investoren senden. */
export async function POST(req: NextRequest) {
  const ctx = await requireEmittent();
  if ('error' in ctx) return ctx.error;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const projectId = cleanText(body.projectId, 36);
  const title = cleanLocalized(body.title, 120);
  const text = cleanLocalizedList(body.body, 20, 2000);
  if (!projectId || !title.de || text.de.length === 0) return NextResponse.json({ error: 'validation' }, { status: 400 });

  const { data, error } = await ctx.supabase
    .from('project_updates')
    .insert({ project_id: projectId, title, body: text })
    .select('id')
    .single();
  if (error || !data) {
    console.error('[emittent/neuigkeiten]', error?.message);
    return NextResponse.json({ error: error?.code === '42501' ? 'not_allowed' : 'server' }, { status: 403 });
  }
  notifyProjectUpdate(data.id).catch((e) => console.error('[email]', e));
  return NextResponse.json({ success: true, id: data.id });
}

export async function DELETE(req: NextRequest) {
  const ctx = await requireEmittent();
  if ('error' in ctx) return ctx.error;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = cleanText(body.id, 36);
  if (!id) return NextResponse.json({ error: 'validation' }, { status: 400 });
  const { error } = await ctx.supabase.from('project_updates').delete().eq('id', id);
  return error ? NextResponse.json({ error: 'server' }, { status: 500 }) : NextResponse.json({ success: true });
}
