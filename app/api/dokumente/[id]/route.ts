import { NextResponse } from 'next/server';
import { getAccount, hasSupabaseEnv } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAdminSession } from '@/lib/admin-session';
import { getOwnProfile } from '@/lib/investments';
import { getDocumentById, signedDocumentUrl } from '@/lib/documents';

const PUBLIC_STATUSES = ['active', 'funded', 'failed', 'cancelled', 'closed'];

/**
 * Download eines Dokuments über einen kurz gültigen signierten Link.
 * Zugriff: Admin, der Emittent des Projekts, eingeloggte Nutzer bei öffentlichen
 * Projekten, sowie der Investor bei Dokumenten seiner Investition.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!hasSupabaseEnv()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  const doc = await getDocumentById(params.id);
  if (!doc || !doc.storage_path) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const admin = getSupabaseAdmin();
  const { data: project } = await admin
    .from('projects')
    .select('id, status, emittent_id')
    .eq('id', doc.project_id)
    .maybeSingle();
  if (!project) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  let allowed = !!(await getAdminSession());
  if (!allowed) {
    const account = await getAccount();
    const profile = account ? await getOwnProfile(account.authId) : null;
    if (profile) {
      if (project.emittent_id === profile.id) allowed = true;
      else if (doc.investment_id) {
        const { data: inv } = await admin
          .from('investments')
          .select('id')
          .eq('id', doc.investment_id)
          .eq('investor_id', profile.id)
          .maybeSingle();
        allowed = !!inv;
      } else if (PUBLIC_STATUSES.includes(project.status)) allowed = true;
    }
  }
  if (!allowed) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const url = await signedDocumentUrl(doc.storage_path);
  if (!url) return NextResponse.json({ error: 'server' }, { status: 500 });
  return NextResponse.redirect(url, { status: 302 });
}
