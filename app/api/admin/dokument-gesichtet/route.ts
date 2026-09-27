import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_lib';

/** Sichtvermerk setzen oder entfernen: LIQUODA hat das Dokument angeschaut (keine Prüfung auf Richtigkeit). */
export async function POST(req: NextRequest) {
  const ctx = await requireAdmin();
  if ('error' in ctx) return ctx.error;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = typeof body.id === 'string' ? body.id : '';
  const reviewed = body.reviewed === true;
  if (!id) return NextResponse.json({ error: 'validation' }, { status: 400 });
  const { error } = await ctx.admin
    .from('documents')
    .update(reviewed ? { reviewed_at: new Date().toISOString(), reviewed_by: ctx.actor } : { reviewed_at: null, reviewed_by: null })
    .eq('id', id);
  return error ? NextResponse.json({ error: 'server', message: error.message }, { status: 500 }) : NextResponse.json({ success: true });
}
