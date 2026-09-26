import 'server-only';
import { getTranslations } from 'next-intl/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { formatChf, formatDate } from '@/lib/format';
import { renderLayout, type EmailBlock } from './layout';
import { EMAIL_ADMIN, sendMail } from './send';

type Locale = 'de' | 'en';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.liquoda.com').replace(/\/$/, '');

function localeUrl(locale: Locale, path: string): string {
  return `${SITE_URL}${locale === 'en' ? '/en' : ''}${path}`;
}

type UserRow = { id: string; name: string; email: string; role: string; locale: Locale };
type ProjectRow = {
  id: string; slug: string; title: { de: string; en?: string }; status: string; review_note: string | null;
  target_amount_chf: number; raised_amount_chf: number; deadline: string; emittent_id: string;
};

async function loadUser(userId: string): Promise<UserRow | null> {
  const { data } = await getSupabaseAdmin().from('users').select('id, name, email, role, locale').eq('id', userId).maybeSingle();
  return (data as UserRow | null) ?? null;
}

async function loadProject(projectId: string): Promise<ProjectRow | null> {
  const { data } = await getSupabaseAdmin()
    .from('projects')
    .select('id, slug, title, status, review_note, target_amount_chf, raised_amount_chf, deadline, emittent_id')
    .eq('id', projectId)
    .maybeSingle();
  return (data as ProjectRow | null) ?? null;
}

async function compose(params: {
  locale: Locale;
  name: string;
  title: string;
  body: string;
  button?: { label: string; href: string };
  facts?: { label: string; value: string }[];
  note?: string;
}) {
  const t = await getTranslations({ locale: params.locale, namespace: 'email' });
  const blocks: EmailBlock[] = [{ type: 'paragraph', text: params.body }];
  if (params.note) blocks.push({ type: 'note', text: params.note });
  if (params.facts?.length) blocks.push({ type: 'facts', items: params.facts });
  if (params.button) blocks.push({ type: 'button', text: params.button.label, href: params.button.href });
  return renderLayout({
    locale: params.locale,
    title: params.title,
    greeting: t('greeting', { name: params.name }),
    blocks,
    footer: t('footer'),
    siteUrl: SITE_URL,
  });
}

/** KYC/KYB-Status geändert (Admin). */
export async function notifyKycStatus(userId: string, status: 'pending' | 'approved' | 'rejected'): Promise<void> {
  const user = await loadUser(userId);
  if (!user) return;
  const t = await getTranslations({ locale: user.locale, namespace: 'email' });
  const key = user.role === 'emittent' && status === 'approved' ? 'kybApproved' : status;
  const home = user.role === 'emittent' ? '/emittent' : '/portfolio';
  const mail = await compose({
    locale: user.locale,
    name: user.name,
    title: t(`kyc.${key}.title`),
    body: t(`kyc.${key}.body`),
    button: { label: t(`kyc.${key}.button`), href: localeUrl(user.locale, home) },
  });
  await sendMail({ to: user.email, subject: t(`kyc.${key}.subject`), ...mail, template: `kyc.${key}`, locale: user.locale, entity: 'users', entityId: user.id });
}

/** Projekt eingereicht: Bestätigung an Emittent, Hinweis an LIQUODA. */
export async function notifyProjectSubmitted(projectId: string): Promise<void> {
  const project = await loadProject(projectId);
  if (!project) return;
  const user = await loadUser(project.emittent_id);
  if (!user) return;
  const t = await getTranslations({ locale: user.locale, namespace: 'email' });
  const mail = await compose({
    locale: user.locale,
    name: user.name,
    title: t('project.submitted.title'),
    body: t('project.submitted.body'),
    facts: [{ label: t('labels.project'), value: project.title[user.locale] ?? project.title.de }],
    button: { label: t('project.submitted.button'), href: localeUrl(user.locale, '/emittent') },
  });
  await sendMail({ to: user.email, subject: t('project.submitted.subject'), ...mail, template: 'project.submitted', locale: user.locale, entity: 'projects', entityId: project.id });

  const tDe = await getTranslations({ locale: 'de', namespace: 'email' });
  const adminMail = await compose({
    locale: 'de',
    name: 'LIQUODA',
    title: tDe('project.submittedAdmin.title'),
    body: tDe('project.submittedAdmin.body'),
    facts: [
      { label: tDe('labels.project'), value: project.title.de },
      { label: tDe('labels.email'), value: user.email },
      { label: tDe('labels.target'), value: formatChf(Number(project.target_amount_chf)) },
    ],
    button: { label: tDe('project.submittedAdmin.button'), href: `${SITE_URL}/admin/projekte/${project.id}` },
  });
  await sendMail({ to: EMAIL_ADMIN, subject: tDe('project.submittedAdmin.subject', { project: project.title.de }), ...adminMail, template: 'project.submittedAdmin', locale: 'de', entity: 'projects', entityId: project.id });
}

/** Projektstatus geändert: active, draft (Rückfrage), cancelled, failed, funded. */
export async function notifyProjectStatus(projectId: string, status: 'active' | 'draft' | 'cancelled' | 'failed' | 'funded'): Promise<void> {
  const project = await loadProject(projectId);
  if (!project) return;
  const user = await loadUser(project.emittent_id);
  if (!user) return;
  const t = await getTranslations({ locale: user.locale, namespace: 'email' });
  const href =
    status === 'active'
      ? localeUrl(user.locale, `/projekte/${project.slug}`)
      : status === 'draft'
        ? localeUrl(user.locale, `/emittent/projekte/${project.id}`)
        : localeUrl(user.locale, '/emittent');
  const mail = await compose({
    locale: user.locale,
    name: user.name,
    title: t(`project.${status}.title`),
    body: t(`project.${status}.body`),
    note: project.review_note && (status === 'draft' || status === 'cancelled') ? `${t('project.noteLabel')}: ${project.review_note}` : undefined,
    facts: [
      { label: t('labels.project'), value: project.title[user.locale] ?? project.title.de },
      { label: t('labels.target'), value: formatChf(Number(project.target_amount_chf)) },
      { label: t('labels.raised'), value: formatChf(Number(project.raised_amount_chf)) },
      { label: t('labels.deadline'), value: formatDate(project.deadline, user.locale) },
    ],
    button: { label: t(`project.${status}.button`), href },
  });
  await sendMail({ to: user.email, subject: t(`project.${status}.subject`), ...mail, template: `project.${status}`, locale: user.locale, entity: 'projects', entityId: project.id });

}

/** Investition: Zahlung erhalten (Webhook) oder Anteile zugewiesen (Mint). */
export async function notifyInvestment(investmentId: string, status: 'paid' | 'confirmed'): Promise<void> {
  const { data: inv } = await getSupabaseAdmin()
    .from('investments')
    .select('id, amount_chf, investor_id, project_id, payment_references(amount_chf)')
    .eq('id', investmentId)
    .maybeSingle();
  if (!inv) return;
  const [user, project] = await Promise.all([loadUser(inv.investor_id), loadProject(inv.project_id)]);
  if (!user || !project) return;
  const t = await getTranslations({ locale: user.locale, namespace: 'email' });
  const pay = (inv.payment_references as { amount_chf: number }[] | null)?.[0];
  const facts = [
    { label: t('labels.project'), value: project.title[user.locale] ?? project.title.de },
    { label: t('labels.amount'), value: formatChf(Number(inv.amount_chf)) },
  ];
  if (status === 'paid' && pay) {
    facts.push({ label: t('labels.total'), value: formatChf(Number(pay.amount_chf)) });
    facts.push({ label: t('labels.reference'), value: inv.id.slice(0, 8) });
  }
  if (status === 'confirmed') facts.push({ label: t('labels.shares'), value: String(Math.round(Number(inv.amount_chf))) });
  const mail = await compose({
    locale: user.locale,
    name: user.name,
    title: t(`investment.${status}.title`),
    body: t(`investment.${status}.body`),
    facts,
    button: { label: t(`investment.${status}.button`), href: localeUrl(user.locale, '/portfolio') },
  });
  await sendMail({ to: user.email, subject: t(`investment.${status}.subject`), ...mail, template: `investment.${status}`, locale: user.locale, entity: 'investments', entityId: inv.id });
}

/** Rückerstattung ausgeführt: Investor informieren (Spec, Abschnitt 11). */
export async function notifyInvestmentRefunded(investmentId: string, refundedChf: number): Promise<void> {
  const { data: inv } = await getSupabaseAdmin()
    .from('investments')
    .select('id, amount_chf, investor_id, project_id')
    .eq('id', investmentId)
    .maybeSingle();
  if (!inv) return;
  const [user, project] = await Promise.all([loadUser(inv.investor_id), loadProject(inv.project_id)]);
  if (!user || !project) return;
  const t = await getTranslations({ locale: user.locale, namespace: 'email' });
  const title = project.title[user.locale] ?? project.title.de;
  const mail = await compose({
    locale: user.locale,
    name: user.name,
    title: t('investment.refunded.title'),
    body: t('investment.refunded.body'),
    facts: [
      { label: t('labels.project'), value: title },
      { label: t('labels.amount'), value: formatChf(Number(inv.amount_chf)) },
      { label: t('labels.refunded'), value: formatChf(refundedChf) },
    ],
    button: { label: t('investment.refunded.button'), href: localeUrl(user.locale, '/portfolio') },
  });
  await sendMail({ to: user.email, subject: t('investment.refunded.subject', { project: title }), ...mail, template: 'investment.refunded', locale: user.locale, entity: 'investments', entityId: inv.id });
}

/** Projektanfrage von der Seite «Für Emittenten»: an LIQUODA plus Eingangsbestätigung. */
export async function notifyProjectRequest(data: {
  name: string; company: string | null; email: string; assetType: string; amount: number | null; description: string; locale: Locale;
}): Promise<void> {
  const tDe = await getTranslations({ locale: 'de', namespace: 'email' });
  const adminMail = await compose({
    locale: 'de',
    name: 'LIQUODA',
    title: tDe('request.admin.title'),
    body: tDe('request.admin.body'),
    facts: [
      { label: 'Name', value: data.name },
      { label: tDe('labels.company'), value: data.company ?? '–' },
      { label: tDe('labels.email'), value: data.email },
      { label: tDe('labels.assetType'), value: data.assetType },
      { label: tDe('labels.estimate'), value: data.amount ? formatChf(data.amount) : '–' },
    ],
    note: data.description,
  });
  await sendMail({ to: EMAIL_ADMIN, subject: tDe('request.admin.subject', { name: data.name }), ...adminMail, template: 'request.admin', locale: 'de', replyTo: data.email });

  const t = await getTranslations({ locale: data.locale, namespace: 'email' });
  const senderMail = await compose({
    locale: data.locale,
    name: data.name,
    title: t('request.sender.title'),
    body: t('request.sender.body'),
    button: { label: t('open'), href: localeUrl(data.locale, '/fuer-emittenten') },
  });
  await sendMail({ to: data.email, subject: t('request.sender.subject'), ...senderMail, template: 'request.sender', locale: data.locale });
}
