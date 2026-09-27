import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getAccount, hasSupabaseEnv } from '@/lib/supabase/server';
import { getOwnProfile } from '@/lib/investments';
import { cleanText } from '@/app/api/emittent/_lib';
import { notifyQuestionNew } from '@/lib/email/notify';

/** Investor stellt eine Frage zu einem offenen oder finanzierten Projekt. */
export async function POST(req: NextRequest) {
  if (!hasSupabaseEnv()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  const account = await getAccount();
  if (!account) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const profile = await getOwnProfile(account.authId);
  if (!profile || profile.role !== 'investor') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const projectId = cleanText(body.projectId, 36);
  const question = cleanText(body.question, 1000);
  if (!projectId || question.length < 10) return NextResponse.json({ error: 'validation' }, { status: 400 });

  const { data, error } = await createSupabaseServerClient()
    .from('project_questions')
    .insert({ project_id: projectId, investor_id: profile.id, question })
    .select('id')
    .single();
  if (error || !data) {
    console.error('[fragen]', error?.message);
    return NextResponse.json({ error: error?.code === '42501' ? 'not_allowed' : 'server' }, { status: 403 });
  }
  notifyQuestionNew(data.id).catch((e) => console.error('[email]', e));
  return NextResponse.json({ success: true });
}
