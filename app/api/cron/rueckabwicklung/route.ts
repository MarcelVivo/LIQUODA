import { NextRequest, NextResponse } from 'next/server';
import { processRefundBacklog } from '@/lib/refunds';

export const maxDuration = 300;

/**
 * Tageslauf (Vercel Cron, siehe vercel.json): erstattet Beteiligungen von Projekten,
 * die der nächtliche Datenbank-Job auf «failed» gesetzt hat, und wiederholt fehlgeschlagene Versuche.
 * Vercel sendet «Authorization: Bearer CRON_SECRET».
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const results = await processRefundBacklog('system:cron');
  const ok = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  if (failed.length) console.error('[cron/rueckabwicklung] failed:', failed);
  return NextResponse.json({ processed: results.length, refunded: ok, failed: failed.length });
}
