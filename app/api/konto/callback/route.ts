import { NextRequest, NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createSupabaseServerClient, hasSupabaseEnv, type AccountRole } from '@/lib/supabase/server';
import { safeNext } from '../_lib';

function homeFor(role: AccountRole | undefined, next: string) {
  if (next && next !== '/') return next;
  const prefix = ''; // Standardsprache ohne Präfix
  if (role === 'emittent') return `${prefix}/emittent`;
  return `${prefix}/portfolio`;
}

/**
 * Ziel der Links aus Bestätigungs- und Magic-Link-E-Mails.
 * Tauscht den Code gegen eine Session und leitet in den Rollenbereich weiter.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const next = safeNext(searchParams.get('next'), '/');
  const loginUrl = (reason: string) => new URL(`/login?error=${reason}`, req.url);

  if (!hasSupabaseEnv()) return NextResponse.redirect(loginUrl('not_configured'));

  const supabase = createSupabaseServerClient();
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  let role: AccountRole | undefined;

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('[konto/callback]', error.message);
      return NextResponse.redirect(loginUrl('link_invalid'));
    }
    role = data.user?.app_metadata?.role as AccountRole | undefined;
  } else if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      console.error('[konto/callback]', error.message);
      return NextResponse.redirect(loginUrl('link_invalid'));
    }
    role = data.user?.app_metadata?.role as AccountRole | undefined;
  } else {
    return NextResponse.redirect(loginUrl('link_invalid'));
  }

  return NextResponse.redirect(new URL(homeFor(role, next), req.url));
}
