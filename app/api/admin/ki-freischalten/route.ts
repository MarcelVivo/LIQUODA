import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_lib';

/** KI-Assistent für ein Projekt manuell freischalten oder sperren (Standard-/Premium-Paket). */
export async function POST(req: NextRequest) {
  const ctx = await requireAdmin();
  if ('error' in ctx) return ctx.error;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const projectId = typeof body.projectId === 'string' ? body.projectId : '';
  const unlocked = body.unlocked === true;
  if (!projectId) return NextResponse.json({ error: 'validation' }, { status: 400 });
  const { error } = await ctx.admin
    .from('projects')
    .update({ ai_unlocked_at: unlocked ? new Date().toISOString() : null })
    .eq('id', projectId);
  if (error) return NextResponse.json({ error: 'server', message: error.message }, { status: 500 });
  await ctx.admin.from('audit_log').insert({ entity: 'projects', entity_id: projectId, action: 'ai_unlocked', old_value: unlocked ? null : 'unlocked', new_value: unlocked ? 'admin' : null, actor_label: ctx.actor });
  return NextResponse.json({ success: true });
}
