import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';

/** Neues Passwort für den angemeldeten Nutzer (nach Klick auf den Link aus der E-Mail). */
export async function POST(req: NextRequest) {
  if (!hasSupabaseEnv()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const password = typeof body.password === 'string' ? body.password : '';
  if (password.length < 8 || password.length > 72) return NextResponse.json({ error: 'validation' }, { status: 400 });
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'session' }, { status: 401 });
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.error('[konto/passwort-neu]', error.message);
    return NextResponse.json({ error: 'server' }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
