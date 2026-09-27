import { NextRequest, NextResponse } from 'next/server';
import { cleanText, requireEmittent } from '../_lib';
import { notifyQuestionAnswered } from '@/lib/email/notify';

/** Frage beantworten (RLS: nur Fragen zu eigenen Projekten). */
export async function POST(req: NextRequest) {
  const ctx = await requireEmittent();
  if ('error' in ctx) return ctx.error;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = cleanText(body.questionId, 36);
  const answer = cleanText(body.answer, 2000);
  if (!id || answer.length < 2) return NextResponse.json({ error: 'validation' }, { status: 400 });
  const { data, error } = await ctx.supabase
    .from('project_questions')
    .update({ answer, answered_at: new Date().toISOString() })
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error || !data) return NextResponse.json({ error: 'server' }, { status: error ? 500 : 404 });
  notifyQuestionAnswered(id).catch((e) => console.error('[email]', e));
  return NextResponse.json({ success: true });
}
