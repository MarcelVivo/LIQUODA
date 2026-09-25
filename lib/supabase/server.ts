import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getLocale } from 'next-intl/server';

/** True, sobald URL und Anon-Key gesetzt sind. */
export function hasSupabaseEnv(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function env() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY müssen gesetzt sein.');
  }
  return { url, key };
}

/**
 * Supabase-Client für Server Components und Route Handlers.
 * Arbeitet mit dem Anon-Key und der Session aus den Cookies; RLS gilt.
 * In Server Components kann kein Cookie gesetzt werden; das übernimmt die Middleware.
 */
export function createSupabaseServerClient() {
  const { url, key } = env();
  const cookieStore = cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Component: Cookies werden von der Middleware aktualisiert
        }
      },
    },
  });
}

export type AccountRole = 'investor' | 'emittent' | 'admin';

export interface Account {
  authId: string;
  email: string;
  role: AccountRole;
  locale: string;
}

/** Eingeloggtes Konto (Rolle aus app_metadata, gesetzt per Datenbank-Trigger) oder null. */
export async function getAccount(): Promise<Account | null> {
  if (!hasSupabaseEnv()) return null;
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const role = (user.app_metadata?.role as AccountRole | undefined) ?? 'investor';
  const locale = await getLocale().catch(() => 'de');
  return { authId: user.id, email: user.email ?? '', role, locale };
}
