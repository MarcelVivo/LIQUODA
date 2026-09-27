import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { EMAIL_RE, cleanString, requestOrigin } from '../_lib';

/** Passwort vergessen: Supabase sendet den Link (Vorlage im LIQUODA-Design, Versand über Resend). */
export async function POST(req: NextRequest) {
  if (!hasSupabaseEnv()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email = cleanString(body.email, 254).toLowerCase();
  if (!email || !EMAIL_RE.test(email)) return NextResponse.json({ error: 'validation' }, { status: 400 });
  const locale = body.locale === 'en' ? '/en' : '';
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${requestOrigin(req)}/api/konto/callback?next=${encodeURIComponent(`${locale}/passwort-neu`)}`,
  });
  if (error) console.error('[konto/passwort-vergessen]', error.message);
  return NextResponse.json({ success: true });
}
