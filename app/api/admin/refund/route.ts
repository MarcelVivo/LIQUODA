import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_lib';
import { processProjectRefunds, refundInvestment } from '@/lib/refunds';

export const maxDuration = 120;

/** Rückerstattung manuell auslösen oder wiederholen: für eine Beteiligung oder ein ganzes Projekt. */
export async function POST(req: NextRequest) {
  const ctx = await requireAdmin();
  if ('error' in ctx) return ctx.error;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const investmentId = typeof body.investmentId === 'string' ? body.investmentId : '';
  const projectId = typeof body.projectId === 'string' ? body.projectId : '';
  if (!investmentId && !projectId) return NextResponse.json({ error: 'validation' }, { status: 400 });

  const results = investmentId ? [await refundInvestment(investmentId, ctx.actor)] : await processProjectRefunds(projectId, ctx.actor);
  const failed = results.filter((r) => !r.ok);
  return NextResponse.json({ processed: results.length, refunded: results.length - failed.length, failed }, { status: failed.length && results.length === failed.length ? 409 : 200 });
}
