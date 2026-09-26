import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

/**
 * Admin-Sitzung des bestehenden Admin-Bereichs (Cookie «admin_session», HS256 mit JWT_SECRET).
 * Für Route Handler, die von der Middleware nicht geschützt werden.
 */
export async function getAdminSession(): Promise<{ email: string } | null> {
  const token = cookies().get('admin_session')?.value;
  const secret = (process.env.JWT_SECRET ?? '').trim();
  if (!token || !secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ['HS256'] });
    const email = typeof payload.email === 'string' ? payload.email : '';
    return email ? { email } : null;
  } catch {
    return null;
  }
}

export function adminActorLabel(session: { email: string }): string {
  return `admin:${session.email}`;
}
