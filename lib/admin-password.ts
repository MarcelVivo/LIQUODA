import 'server-only';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * Admin-Passwort: Datenbank-Hash (scrypt) hat Vorrang, sonst ADMIN_PASSWORD aus der Umgebung.
 * Zurücksetzen per einmaligem Token (Gültigkeit 60 Minuten), das nur als SHA-256 gespeichert wird.
 */

export function adminEmail(): string {
  return (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}$${hash}`;
}

export function verifyHash(password: string, stored: string): boolean {
  const [salt, hash] = stored.split('$');
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export async function verifyAdminLogin(email: string, password: string): Promise<boolean> {
  const e = email.trim().toLowerCase();
  if (!e || e !== adminEmail()) return false;
  const { data } = await getSupabaseAdmin().from('admin_accounts').select('password_hash').eq('email', e).maybeSingle();
  if (data?.password_hash) return verifyHash(password, data.password_hash);
  const envPassword = (process.env.ADMIN_PASSWORD ?? '').trim();
  return !!envPassword && password === envPassword;
}

const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');

/** Token erzeugen und speichern; gibt das Klartext-Token für den Link zurück. */
export async function createResetToken(email: string): Promise<string | null> {
  const e = email.trim().toLowerCase();
  if (!e || e !== adminEmail()) return null;
  const token = randomBytes(32).toString('hex');
  const { error } = await getSupabaseAdmin().from('admin_accounts').upsert({
    email: e,
    reset_token_hash: tokenHash(token),
    reset_expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error('[admin-password] token:', error.message);
    return null;
  }
  return token;
}

/** Neues Passwort setzen, wenn das Token gültig ist. */
export async function resetPasswordWithToken(token: string, password: string): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from('admin_accounts')
    .select('email, reset_expires_at')
    .eq('reset_token_hash', tokenHash(token))
    .maybeSingle();
  if (!data || !data.reset_expires_at || new Date(data.reset_expires_at) < new Date()) return false;
  const { error } = await admin
    .from('admin_accounts')
    .update({ password_hash: hashPassword(password), reset_token_hash: null, reset_expires_at: null, updated_at: new Date().toISOString() })
    .eq('email', data.email);
  return !error;
}
