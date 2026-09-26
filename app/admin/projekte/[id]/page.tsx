import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSupabaseAdmin } from '@/lib/supabase';
import AdminNav from '../../_components/AdminNav';
import ProjectActions from '../../_components/ProjectActions';
import { card, chf, dt, STATUS_LABEL, KYC_LABEL } from '../../_lib';

export const dynamic = 'force-dynamic';

type L = { de: string; en?: string };
type Project = {
  id: string; slug: string; status: string; review_note: string | null; asset_type: string; token_model: string;
  title: L; summary: L; purpose: L; location: L; description: { de: string[]; en?: string[] }; risks: { de: string[]; en?: string[] };
  target_amount_chf: number; min_investment_chf: number; raised_amount_chf: number; deadline: string; created_at: string; updated_at: string;
  collateral_type: string; collateral_note: string | null;
  emittent: { id: string; name: string; email: string; kyc_status: string } | null;
};
type Doc = { id: string; type: string; title: L; version: number; sha256_hash: string | null; created_at: string };
type Inv = { id: string; amount_chf: number; status: string; created_at: string; investor: { name: string; email: string } | null };
type Audit = { id: number; actor_label: string | null; action: string; old_value: string | null; new_value: string | null; created_at: string };

export default async function AdminProjectDetail({ params }: { params: { id: string } }) {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from('projects')
    .select('*, emittent:users!projects_emittent_id_fkey(id, name, email, kyc_status)')
    .eq('id', params.id)
    .maybeSingle();
  if (!data) notFound();
  const p = data as unknown as Project;
  const [{ data: docs }, { data: invs }, { data: audit }] = await Promise.all([
    admin.from('documents').select('id, type, title, version, sha256_hash, created_at').eq('project_id', p.id).is('investment_id', null).order('created_at'),
    admin.from('investments').select('id, amount_chf, status, created_at, investor:users!investments_investor_id_fkey(name, email)').eq('project_id', p.id).order('created_at', { ascending: false }),
    admin.from('audit_log').select('id, actor_label, action, old_value, new_value, created_at').eq('entity', 'projects').eq('entity_id', p.id).order('created_at', { ascending: false }).limit(20),
  ]);
  const documents = (docs ?? []) as Doc[];
  const investments = (invs ?? []) as unknown as Inv[];
  const history = (audit ?? []) as Audit[];
  const label = 'text-[10px] font-semibold tracking-[0.25em] uppercase text-gray-400';

  return (
    <div className="min-h-screen bg-[#F5F5F3] p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <AdminNav title={p.title.de} />
        <Link href="/admin/projekte" className="text-xs text-gray-500 underline underline-offset-4">← Alle Projekte</Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <div className={`${card} p-6`}>
              <p className={label}>Eckdaten</p>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-gray-400">Status</dt><dd className="font-semibold">{STATUS_LABEL[p.status]}</dd></div>
                <div><dt className="text-gray-400">Slug</dt><dd className="font-mono text-xs">{p.slug}</dd></div>
                <div><dt className="text-gray-400">Asset / Token</dt><dd>{p.asset_type} · {p.token_model}</dd></div>
                <div><dt className="text-gray-400">Ort</dt><dd>{p.location.de}</dd></div>
                <div><dt className="text-gray-400">Zielbetrag</dt><dd className="font-semibold">{chf(p.target_amount_chf)}</dd></div>
                <div><dt className="text-gray-400">Erreicht</dt><dd className="font-semibold">{chf(p.raised_amount_chf)}</dd></div>
                <div><dt className="text-gray-400">Mindestbetrag</dt><dd>{chf(p.min_investment_chf)}</dd></div>
                <div><dt className="text-gray-400">Laufzeit bis</dt><dd>{p.deadline}</dd></div>
                <div className="sm:col-span-2"><dt className="text-gray-400">Absicherung (Angabe Emittent, nicht bewertet)</dt><dd>{p.collateral_type}{p.collateral_note ? ` · ${p.collateral_note}` : ''}</dd></div>
                <div><dt className="text-gray-400">Emittent</dt><dd>{p.emittent?.name} <span className="text-gray-400">({p.emittent?.email})</span></dd></div>
                <div><dt className="text-gray-400">KYB</dt><dd>{KYC_LABEL[p.emittent?.kyc_status ?? 'pending']}</dd></div>
              </dl>
              {p.review_note && <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900"><b>Letzte Rückmeldung:</b> {p.review_note}</p>}
            </div>

            <div className={`${card} p-6 space-y-4 text-sm`}>
              <div><p className={label}>Kurzbeschreibung</p><p className="mt-2">{p.summary.de}</p></div>
              <div><p className={label}>Beschreibung</p>{(p.description?.de ?? []).map((t, i) => <p key={i} className="mt-2">{t}</p>)}</div>
              <div><p className={label}>Verwendung des Kapitals</p><p className="mt-2">{p.purpose.de}</p></div>
              <div><p className={label}>Projektspezifische Risiken</p><ul className="mt-2 list-disc pl-5">{(p.risks?.de ?? []).map((t, i) => <li key={i}>{t}</li>)}</ul></div>
              {p.summary.en && <p className="text-xs text-gray-400">EN-Fassung vorhanden: {p.title.en}</p>}
            </div>

            <div className={`${card} p-6`}>
              <p className={label}>Dokumente ({documents.length})</p>
              {documents.length === 0 ? <p className="mt-2 text-sm text-gray-400">Keine Dokumente.</p> : (
                <ul className="mt-3 divide-y divide-gray-100 text-sm">
                  {documents.map((d) => (
                    <li key={d.id} className="py-2">
                      <a href={`/api/dokumente/${d.id}`} target="_blank" rel="noopener" className="font-medium underline decoration-gray-300 underline-offset-4">{d.title.de}</a>
                      <span className="ml-2 text-xs text-gray-400">{d.type} · v{d.version} · {dt(d.created_at)}</span>
                      {d.sha256_hash && <span className="block font-mono text-[10px] text-gray-400">{d.sha256_hash}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={`${card} p-6`}>
              <p className={label}>Investitionen ({investments.length})</p>
              {investments.length === 0 ? <p className="mt-2 text-sm text-gray-400">Keine Investitionen.</p> : (
                <table className="mt-3 w-full text-sm">
                  <tbody>
                    {investments.map((i) => (
                      <tr key={i.id} className="border-t border-gray-100">
                        <td className="py-2">{i.investor?.name} <span className="text-xs text-gray-400">{i.investor?.email}</span></td>
                        <td className="py-2 font-semibold">{chf(i.amount_chf)}</td>
                        <td className="py-2">{i.status}</td>
                        <td className="py-2 text-xs text-gray-400">{dt(i.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className={`${card} p-6`}>
              <p className={label}>Aktionen</p>
              <div className="mt-3"><ProjectActions projectId={p.id} status={p.status} /></div>
            </div>
            <div className={`${card} p-6`}>
              <p className={label}>Verlauf</p>
              {history.length === 0 ? <p className="mt-2 text-sm text-gray-400">Noch keine Einträge.</p> : (
                <ul className="mt-3 space-y-2 text-xs">
                  {history.map((h) => (
                    <li key={h.id}>
                      <span className="text-gray-400">{dt(h.created_at)}</span> · {h.action}: {h.old_value} → <b>{h.new_value}</b>
                      <span className="block text-gray-400">{h.actor_label ?? 'Emittent/Backend'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
