import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { EMAIL_RE, cleanString, requestOrigin, safeNext } from '../_lib';

const ROLES = ['investor', 'emittent'] as const;

/**
 * Kontoerstellung mit Rollenwahl (Spec, Abschnitt 3). Supabase Auth versendet
 * die Bestätigungs-E-Mail; der Datenbank-Trigger legt das Profil in «users» an.
 */
export async function POST(req: NextRequest) {
  if (!hasSupabaseEnv()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const name = cleanString(body.name, 120);
  const email = cleanString(body.email, 254).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  const role = typeof body.role === 'string' ? body.role : '';
  const fields: string[] = [];
  if (!name) fields.push('name');
  if (!email || !EMAIL_RE.test(email)) fields.push('email');
  if (password.length < 8 || password.length > 72) fields.push('password');
  if (!(ROLES as readonly string[]).includes(role)) fields.push('role');
  if (body.consent !== true) fields.push('consent');
  if (fields.length) return NextResponse.json({ error: 'validation', fields }, { status: 400 });

  const next = safeNext(body.next, '/');
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, role },
      emailRedirectTo: `${requestOrigin(req)}/api/konto/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    console.error('[konto/registrieren]', error.message);
    const code = error.message.toLowerCase().includes('password') ? 'weak_password' : 'signup_failed';
    return NextResponse.json({ error: code }, { status: 400 });
  }

  // Mit aktiver E-Mail-Bestätigung gibt es noch keine Session.
  return NextResponse.json({ success: true, confirmationRequired: !data.session });
}
