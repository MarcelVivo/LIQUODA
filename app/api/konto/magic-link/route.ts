import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { EMAIL_RE, cleanString, requestOrigin, safeNext } from '../_lib';

/** Login per Magic Link (Spec, Abschnitt 3). Antwort ist bewusst immer gleich. */
export async function POST(req: NextRequest) {
  if (!hasSupabaseEnv()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const email = cleanString(body.email, 254).toLowerCase();
  if (!email || !EMAIL_RE.test(email)) return NextResponse.json({ error: 'validation' }, { status: 400 });

  const next = safeNext(body.next, '/');
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false, // nur bestehende Konten; Registrierung läuft über /registrieren
      emailRedirectTo: `${requestOrigin(req)}/api/konto/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) console.error('[konto/magic-link]', error.message);

  // Keine Auskunft, ob die Adresse existiert
  return NextResponse.json({ success: true });
}
