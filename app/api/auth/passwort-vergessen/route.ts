import { NextRequest, NextResponse } from 'next/server';
import { createResetToken } from '@/lib/admin-password';
import { sendMail } from '@/lib/email/send';
import { renderLayout } from '@/lib/email/layout';
import { requestOrigin } from '@/app/api/konto/_lib';

/** Admin: Link zum Zurücksetzen per E-Mail. Antwort ist immer gleich, verrät keine Adressen. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const token = email ? await createResetToken(email) : null;
  if (token) {
    const link = `${requestOrigin(req)}/admin/passwort?token=${token}`;
    const { html, text } = renderLayout({
      locale: 'de',
      title: 'Admin-Passwort zurücksetzen',
      greeting: 'Guten Tag',
      blocks: [
        { type: 'paragraph', text: 'Mit dem folgenden Link können Sie ein neues Passwort für den Admin-Bereich von LIQUODA setzen. Der Link ist 60 Minuten gültig und kann nur einmal verwendet werden.' },
        { type: 'button', text: 'Neues Passwort setzen', href: link },
        { type: 'note', text: 'Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail. Das bisherige Passwort bleibt gültig.' },
      ],
      footer: 'Diese E-Mail wurde automatisch von LIQUODA gesendet.',
      siteUrl: requestOrigin(req),
    });
    await sendMail({ to: email, subject: 'LIQUODA Admin: Passwort zurücksetzen', html, text, template: 'admin.reset', locale: 'de' });
  }
  return NextResponse.json({ success: true });
}
