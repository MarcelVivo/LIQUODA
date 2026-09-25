import { createServerClient } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';
import type { AccountRole } from './server';

/**
 * Session in der Middleware auffrischen und Nutzer ermitteln.
 * Cookies werden auf Request und Response gesetzt, damit Server Components
 * und der Browser denselben Stand sehen.
 */
export async function refreshSession(request: NextRequest, response: NextResponse) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { user: null, role: null as AccountRole | null };

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = (user?.app_metadata?.role as AccountRole | undefined) ?? (user ? 'investor' : null);
  return { user, role };
}
