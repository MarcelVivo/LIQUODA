import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_lib';

/** Moderation: Neuigkeiten und Fragen ausblenden, einblenden oder löschen. */
export async function POST(req: NextRequest) {
  const ctx = await requireAdmin();
  if ('error' in ctx) return ctx.error;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const type = body.type === 'update' ? 'project_updates' : body.type === 'question' ? 'project_questions' : null;
  const id = typeof body.id === 'string' ? body.id : '';
  const action = typeof body.action === 'string' ? body.action : '';
  if (!type || !id || !['hide', 'show', 'delete'].includes(action)) return NextResponse.json({ error: 'validation' }, { status: 400 });
  const q = ctx.admin.from(type);
  const { error } = action === 'delete' ? await q.delete().eq('id', id) : await q.update({ hidden: action === 'hide' }).eq('id', id);
  return error ? NextResponse.json({ error: 'server', message: error.message }, { status: 500 }) : NextResponse.json({ success: true });
}
