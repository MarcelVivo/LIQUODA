import 'server-only';
import { Resend } from 'resend';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * E-Mail-Versand über Resend (Spec, Abschnitt 5: externer Dienst, Secrets nur in Env).
 * Ohne RESEND_API_KEY wird nichts gesendet, aber protokolliert («skipped»), damit
 * lokale Umgebungen ohne Schlüssel funktionieren.
 */

export const EMAIL_FROM = process.env.EMAIL_FROM ?? 'LIQUODA <noreply@liquoda.com>';
export const EMAIL_ADMIN = process.env.EMAIL_ADMIN ?? 'info@liquoda.com';

export function hasEmailEnv(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export interface MailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  template: string;
  locale?: 'de' | 'en';
  entity?: string;
  entityId?: string;
  replyTo?: string;
}

export async function sendMail(input: MailInput): Promise<{ ok: boolean; id?: string; error?: string }> {
  const admin = getSupabaseAdmin();
  const log = async (status: 'sent' | 'failed' | 'skipped', providerId?: string, error?: string) => {
    await admin.from('email_log').insert({
      to_email: input.to,
      template: input.template,
      subject: input.subject,
      locale: input.locale ?? 'de',
      entity: input.entity ?? null,
      entity_id: input.entityId ?? null,
      provider_id: providerId ?? null,
      status,
      error: error ?? null,
    });
  };

  if (!hasEmailEnv()) {
    console.warn(`[email] RESEND_API_KEY fehlt, Mail «${input.template}» an ${input.to} nicht gesendet.`);
    await log('skipped', undefined, 'RESEND_API_KEY missing');
    return { ok: false, error: 'not_configured' };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: input.to,
      replyTo: input.replyTo ?? EMAIL_ADMIN,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    if (error) {
      console.error('[email] send:', error.message);
      await log('failed', undefined, error.message);
      return { ok: false, error: error.message };
    }
    await log('sent', data?.id);
    return { ok: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown';
    console.error('[email] send:', message);
    await log('failed', undefined, message);
    return { ok: false, error: message };
  }
}
