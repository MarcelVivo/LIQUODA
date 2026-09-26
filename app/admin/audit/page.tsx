import { getSupabaseAdmin } from '@/lib/supabase';
import AdminNav from '../_components/AdminNav';
import { card, td, th, dt } from '../_lib';

type Row = { id: number; actor_label: string | null; actor_id: string | null; entity: string; entity_id: string; action: string; old_value: string | null; new_value: string | null; created_at: string };

export const dynamic = 'force-dynamic';

export default async function AdminAudit() {
  const { data } = await getSupabaseAdmin()
    .from('audit_log')
    .select('id, actor_label, actor_id, entity, entity_id, action, old_value, new_value, created_at')
    .order('created_at', { ascending: false })
    .limit(200);
  const rows = (data ?? []) as Row[];

  return (
    <div className="min-h-screen bg-[#F5F5F3] p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <AdminNav title="Audit-Log" />
        <div className={`${card} overflow-hidden`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className={th}>Zeit</th><th className={th}>Wer</th><th className={th}>Entität</th><th className={th}>Aktion</th><th className={th}>Von</th><th className={th}>Nach</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-sm text-gray-400">Noch keine Einträge.</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                  <td className={`${td} text-xs text-gray-400 whitespace-nowrap`}>{dt(r.created_at)}</td>
                  <td className={`${td} text-xs`}>{r.actor_label ?? (r.actor_id ? `Nutzer ${r.actor_id.slice(0, 8)}` : 'Backend')}</td>
                  <td className={td}>{r.entity} <span className="font-mono text-[10px] text-gray-400">{r.entity_id.slice(0, 8)}</span></td>
                  <td className={td}>{r.action}</td>
                  <td className={`${td} text-gray-500`}>{r.old_value ?? '–'}</td>
                  <td className={`${td} font-semibold`}>{r.new_value ?? '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-gray-400">Die letzten 200 Einträge. Einträge entstehen ausschliesslich über Datenbank-Trigger.</p>
      </div>
    </div>
  );
}
