import { NextRequest, NextResponse } from 'next/server';
import { hasKiEnv, kiErrorCode } from '@/lib/ki/client';
import { logSupportTurns, sanitizeHistory, streamSupportAnswer } from '@/lib/ki/support';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const UUID_RE = /^[0-9a-f-]{36}$/i;

// Einfache Begrenzung je IP und Prozess: 30 Nachrichten pro 10 Minuten
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 30;
const buckets = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now();
  const hits = (buckets.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= LIMIT) return true;
  hits.push(now);
  buckets.set(ip, hits);
  if (buckets.size > 5000) buckets.clear();
  return false;
}

/** Support-Bot der Website: Verlauf kommt vom Browser, Antwort wird als Text gestreamt. */
export async function POST(req: NextRequest) {
  if (!hasKiEnv()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'local';
  if (limited(ip)) return NextResponse.json({ error: 'rate' }, { status: 429 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const history = sanitizeHistory(body.messages);
  if (!history.length || history[history.length - 1].role !== 'user') return NextResponse.json({ error: 'validation' }, { status: 400 });
  const locale = body.locale === 'en' ? 'en' : 'de';
  const sessionId = typeof body.sessionId === 'string' && UUID_RE.test(body.sessionId) ? body.sessionId : crypto.randomUUID();

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const answer = await streamSupportAnswer({ history, locale, onText: (delta) => controller.enqueue(encoder.encode(delta)) });
        const last = history[history.length - 1];
        logSupportTurns(sessionId, locale, answer ? [last, { role: 'assistant', content: answer }] : [last]).catch(() => undefined);
      } catch (err) {
        controller.enqueue(encoder.encode(`\u0000${kiErrorCode(err)}`));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no', 'X-Session-Id': sessionId },
  });
}
