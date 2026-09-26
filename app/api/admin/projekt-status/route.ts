import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 120;
import { requireAdmin } from '../_lib';
import { notifyProjectStatus } from '@/lib/email/notify';
import { processProjectRefunds } from '@/lib/refunds';

const STATUSES = ['active', 'draft', 'cancelled', 'failed'] as const;

/**
 * Projektprüfung (Spec, Abschnitt 7, «manuell»): Freigabe (in_review -> active),
 * Rückfrage (in_review -> draft mit Begründung), vorzeitiges Ende (active -> cancelled/failed).
 */
export async function POST(req: NextRequest) {
  const ctx = await requireAdmin();
  if ('error' in ctx) return ctx.error;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const projectId = typeof body.projectId === 'string' ? body.projectId : '';
  const status = typeof body.status === 'string' ? body.status : '';
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 2000) : '';
  if (!projectId || !(STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: 'validation' }, { status: 400 });
  }
  if ((status === 'draft' || status === 'cancelled') && !note) {
    return NextResponse.json({ error: 'note_required' }, { status: 400 });
  }

  const { error } = await ctx.admin.rpc('admin_set_project_status', {
    p_project_id: projectId,
    p_status: status,
    p_note: note,
    p_actor: ctx.actor,
  });
  if (error) {
    console.error('[admin/projekt-status]', error.message);
    return NextResponse.json({ error: 'server', message: error.message }, { status: 409 });
  }
  notifyProjectStatus(projectId, status as 'active' | 'draft' | 'cancelled' | 'failed').catch((e) => console.error('[email]', e));
  // Rückabwicklung sofort und automatisch (Spec, Abschnitt 7); Ergebnis im Admin sichtbar
  let refunds: { processed: number; refunded: number; failed: number } | undefined;
  if (status === 'failed' || status === 'cancelled') {
    const results = await processProjectRefunds(projectId, ctx.actor);
    refunds = { processed: results.length, refunded: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length };
  }
  return NextResponse.json({ success: true, refunds });
}
