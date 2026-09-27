import { NextRequest, NextResponse } from 'next/server';
import { requireEmittent } from '../../../_lib';
import { getOwnProject, listProjectDocuments } from '@/lib/emittent';
import { hasKiEnv, kiErrorCode } from '@/lib/ki/client';
import { loadConversation, resetConversation, runAssistant, toDisplay, type KiEvent } from '@/lib/ki/assistent';
import { latestPrecheck } from '@/lib/ki/vorpruefung';
import { settleOpenAiOrders } from '@/lib/ki/freischaltung';
import { hasStripeEnv } from '@/lib/stripe';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const UUID_RE = /^[0-9a-f-]{36}$/i;
const MAX_MESSAGE_CHARS = 8000;

/** Stand des Assistenten: Freischaltung, Verlauf, letzte Vorprüfung. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await requireEmittent();
  if ('error' in ctx) return ctx.error;
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  let project = await getOwnProject(params.id);
  if (!project) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  // Offene Bestellungen mit Stripe abgleichen (falls der Webhook noch nicht eingetroffen ist)
  if (!project.ai_unlocked_at && hasStripeEnv()) {
    const unlocked = await settleOpenAiOrders(project.id);
    if (unlocked) project = (await getOwnProject(params.id)) ?? project;
  }

  const [messages, precheck] = await Promise.all([loadConversation(project.id), latestPrecheck(project.id)]);
  return NextResponse.json({
    configured: hasKiEnv(),
    stripe: hasStripeEnv(),
    unlocked: !!project.ai_unlocked_at,
    status: project.status,
    messages: toDisplay(messages),
    precheck: precheck ? { verdict: precheck.verdict, score: precheck.score, result: precheck.result, createdAt: precheck.created_at } : null,
  });
}

/** Nachricht an den Assistenten; Antwort als NDJSON-Stream von Ereignissen. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await requireEmittent();
  if ('error' in ctx) return ctx.error;
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (!hasKiEnv()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, MAX_MESSAGE_CHARS) : '';
  if (!message) return NextResponse.json({ error: 'validation' }, { status: 400 });

  const project = await getOwnProject(params.id);
  if (!project) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (!project.ai_unlocked_at) return NextResponse.json({ error: 'not_unlocked' }, { status: 402 });
  const documents = await listProjectDocuments(project.id);
  const locale = ctx.account.locale === 'en' ? 'en' : 'de';

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: KiEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        await runAssistant({ project, documents, locale, userName: ctx.profile.name ?? '', message, emit });
      } catch (err) {
        emit({ type: 'error', code: kiErrorCode(err) });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' },
  });
}

/** Gespräch neu beginnen (Verlauf löschen; Projektdaten und Dokumente bleiben). */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await requireEmittent();
  if ('error' in ctx) return ctx.error;
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const project = await getOwnProject(params.id);
  if (!project) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  await resetConversation(project.id);
  return NextResponse.json({ success: true });
}
