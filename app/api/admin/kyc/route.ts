import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_lib';

const STATUSES = ['pending', 'approved', 'rejected'] as const;

/** KYC/KYB-Status manuell setzen (Spec, Abschnitt 5 und 7). Protokoll über Datenbank-Trigger. */
export async function POST(req: NextRequest) {
  const ctx = await requireAdmin();
  if ('error' in ctx) return ctx.error;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const userId = typeof body.userId === 'string' ? body.userId : '';
  const status = typeof body.status === 'string' ? body.status : '';
  if (!userId || !(STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: 'validation' }, { status: 400 });
  }

  const { error } = await ctx.admin.rpc('admin_set_kyc', { p_user_id: userId, p_status: status, p_actor: ctx.actor });
  if (error) {
    console.error('[admin/kyc]', error.message);
    return NextResponse.json({ error: 'server', message: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
