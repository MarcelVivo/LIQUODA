/**
 * HTML-Rahmen für System-Mails im Präsentationsdesign (Ink, Petrol, Creme).
 * Tabellenbasiert und ohne externe Ressourcen, damit es in allen Mail-Programmen funktioniert.
 */
export interface EmailBlock {
  type: 'paragraph' | 'facts' | 'button' | 'note';
  text?: string;
  items?: { label: string; value: string }[];
  href?: string;
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderLayout(params: {
  locale: 'de' | 'en';
  title: string;
  greeting: string;
  blocks: EmailBlock[];
  footer: string;
  siteUrl: string;
}): { html: string; text: string } {
  const body = params.blocks
    .map((b) => {
      switch (b.type) {
        case 'paragraph':
          return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#14181C;">${esc(b.text ?? '')}</p>`;
        case 'note':
          return `<p style="margin:0 0 16px;padding:12px 14px;border-left:4px solid #1FA88C;background:#F7F5F1;font-size:14px;line-height:1.6;color:#14181C;">${esc(b.text ?? '')}</p>`;
        case 'facts':
          return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border-top:1px solid #E6E2DA;">${(b.items ?? [])
            .map(
              (i) =>
                `<tr><td style="padding:8px 0;border-bottom:1px solid #E6E2DA;font-size:13px;color:#5C6B77;">${esc(i.label)}</td><td align="right" style="padding:8px 0;border-bottom:1px solid #E6E2DA;font-size:13px;font-weight:600;color:#0E2233;">${esc(i.value)}</td></tr>`
            )
            .join('')}</table>`;
        case 'button':
          return `<p style="margin:8px 0 20px;"><a href="${esc(b.href ?? params.siteUrl)}" style="display:inline-block;padding:12px 24px;border-radius:999px;background:#1FA88C;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">${esc(b.text ?? '')}</a></p>`;
        default:
          return '';
      }
    })
    .join('');

  const html = `<!doctype html><html lang="${params.locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(params.title)}</title></head>
<body style="margin:0;padding:0;background:#F7F5F1;font-family:Inter,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F5F1;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td style="padding:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:28px;color:#0E2233;">Liquoda<span style="color:#1FA88C;font-weight:700;">.-</span></td></tr>
<tr><td style="background:#ffffff;border-radius:16px;padding:32px 28px;box-shadow:0 2px 16px rgba(14,34,51,0.07);">
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0E2233;">${esc(params.title)}</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#14181C;">${esc(params.greeting)}</p>
${body}
</td></tr>
<tr><td style="padding:20px 8px 0;font-size:12px;line-height:1.6;color:#5C6B77;">${esc(params.footer)}</td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    params.title,
    '',
    params.greeting,
    '',
    ...params.blocks.map((b) => {
      if (b.type === 'facts') return (b.items ?? []).map((i) => `${i.label}: ${i.value}`).join('\n');
      if (b.type === 'button') return `${b.text}: ${b.href ?? params.siteUrl}`;
      return b.text ?? '';
    }),
    '',
    params.footer,
  ].join('\n');

  return { html, text };
}
