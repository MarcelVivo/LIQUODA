import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, hasSupabaseEnv, type AccountRole } from '@/lib/supabase/server';
import { EMAIL_RE, cleanString } from '../_lib';

/** Login mit E-Mail und Passwort. Die Session landet als Cookie. */
export async function POST(req: NextRequest) {
  if (!hasSupabaseEnv()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const email = cleanString(body.email, 254).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !EMAIL_RE.test(email) || !password) {
    return NextResponse.json({ error: 'validation' }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    const code = error?.message.toLowerCase().includes('not confirmed') ? 'email_not_confirmed' : 'invalid_credentials';
    return NextResponse.json({ error: code }, { status: 401 });
  }

  const role = (data.user.app_metadata?.role as AccountRole | undefined) ?? 'investor';
  return NextResponse.json({ success: true, role });
}
