import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import { refreshSession } from './lib/supabase/middleware';

const intlMiddleware = createIntlMiddleware(routing);

// Rollen-Routing (Spec, Abschnitt 3): Investoren-Bereich und Emittenten-Dashboard
const PROTECTED: Record<string, 'investor' | 'emittent'> = {
  '/portfolio': 'investor',
  '/investieren': 'investor',
  '/emittent': 'emittent',
};
const AUTH_PAGES = ['/login', '/registrieren'];

/** Locale-Präfix abtrennen: "/en/portfolio" -> { locale: "en", path: "/portfolio" } */
function splitLocale(pathname: string) {
  const match = pathname.match(/^\/(de|en)(?=\/|$)/);
  const locale = match ? match[1] : routing.defaultLocale;
  const path = match ? pathname.slice(match[0].length) || '/' : pathname;
  return { locale, path, prefix: locale === routing.defaultLocale ? '' : `/${locale}` };
}

function homeFor(role: string | null, prefix: string) {
  if (role === 'emittent') return `${prefix}/emittent`;
  if (role === 'admin') return '/admin';
  return `${prefix}/portfolio`;
}

// Verify a jose-issued HS256 JWT using Web Crypto (no external library needed)
async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const [header, payload, sig] = parts;

    const secret = process.env.JWT_SECRET ?? 'dev-secret';
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigBytes = Uint8Array.from(
      atob(sig.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(sig.length / 4) * 4, '=')),
      (c) => c.charCodeAt(0)
    );

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      new TextEncoder().encode(`${header}.${payload}`)
    );

    if (!valid) return false;

    const { exp } = JSON.parse(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '='))
    );
    return !exp || exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bestehender Admin-Bereich mit eigenem Login (unverändert)
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') return NextResponse.next();

    const token = request.cookies.get('admin_session')?.value;
    if (!token || !(await verifyAdminToken(token))) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return NextResponse.next();
  }

  const response = intlMiddleware(request);
  const { path, prefix } = splitLocale(pathname);
  const protectedRole = Object.entries(PROTECTED).find(([base]) => path === base || path.startsWith(`${base}/`))?.[1];
  const isAuthPage = AUTH_PAGES.includes(path);

  // Session nur dort prüfen, wo sie eine Rolle spielt
  if (!protectedRole && !isAuthPage) return response;

  const { user, role } = await refreshSession(request, response);

  const redirect = (to: string) => {
    const res = NextResponse.redirect(new URL(to, request.url));
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  if (protectedRole) {
    if (!user) {
      const next = encodeURIComponent(pathname + request.nextUrl.search);
      return redirect(`${prefix}/login?next=${next}`);
    }
    if (role !== protectedRole && role !== 'admin') {
      return redirect(homeFor(role, prefix));
    }
  }

  // Eingeloggte Nutzer sehen Login/Registrierung nicht mehr
  if (isAuthPage && user) {
    return redirect(homeFor(role, prefix));
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)', '/admin/:path*'],
};
