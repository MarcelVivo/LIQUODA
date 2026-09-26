import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/supabase';
import AdminNav from '../_components/AdminNav';
import { card, chf, td, th, dt, STATUS_LABEL } from '../_lib';

type Row = {
  id: string; slug: string; title: { de: string }; status: string; asset_type: string;
  target_amount_chf: number; raised_amount_chf: number; deadline: string; updated_at: string;
  emittent: { name: string; email: string; kyc_status: string } | null;
};

export const dynamic = 'force-dynamic';

const ORDER = ['in_review', 'active', 'draft', 'funded', 'approved', 'failed', 'cancelled', 'closed'];

export default async function AdminProjects() {
  const { data } = await getSupabaseAdmin()
    .from('projects')
    .select('id, slug, title, status, asset_type, target_amount_chf, raised_amount_chf, deadline, updated_at, emittent:users!projects_emittent_id_fkey(name, email, kyc_status)')
    .order('updated_at', { ascending: false });
  const rows = ((data ?? []) as unknown as Row[]).sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status));
  const pending = rows.filter((r) => r.status === 'in_review').length;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-[#F5F5F3] p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <AdminNav title="Projektprüfung" />
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'In Prüfung', value: pending },
            { label: 'Offen', value: rows.filter((r) => r.status === 'active').length },
            { label: 'Gesamt', value: rows.length },
          ].map((s) => (
            <div key={s.label} className={`${card} p-6`}>
              <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-gray-400">{s.label}</p>
              <p className="mt-2 text-4xl font-semibold text-[#0b1830]">{s.value}</p>
            </div>
          ))}
        </div>
        <div className={`${card} overflow-hidden`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className={th}>Projekt</th><th className={th}>Emittent</th><th className={th}>Status</th><th className={th}>Ziel / erreicht</th><th className={th}>Laufzeit bis</th><th className={th}>Geändert</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-sm text-gray-400">Noch keine Projekte.</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                  <td className={`${td} font-medium`}>
                    <Link href={`/admin/projekte/${r.id}`} className="underline decoration-gray-300 underline-offset-4 hover:decoration-[#0b1830]">{r.title.de}</Link>
                    <span className="block text-xs text-gray-400">{r.asset_type} · {r.slug}</span>
                  </td>
                  <td className={`${td} text-gray-500`}>
                    {r.emittent?.name ?? '–'}
                    <span className="block text-xs">{r.emittent?.email} · KYB {r.emittent?.kyc_status}</span>
                  </td>
                  <td className={td}>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${r.status === 'in_review' ? 'bg-amber-50 text-amber-700' : r.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{STATUS_LABEL[r.status]}</span>
                    {r.status === 'active' && r.deadline < today && <span className="block mt-1 text-[10px] text-red-600">Laufzeit abgelaufen</span>}
                  </td>
                  <td className={td}>{chf(r.target_amount_chf)} <span className="text-gray-400">/ {chf(r.raised_amount_chf)}</span></td>
                  <td className={td}>{r.deadline}</td>
                  <td className={`${td} text-xs text-gray-400`}>{dt(r.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
