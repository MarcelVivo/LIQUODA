import { getSupabaseAdmin } from '@/lib/supabase';
import AdminNav from '../_components/AdminNav';
import { card, td, th, dt } from '../_lib';

type Row = { id: number; to_email: string; template: string; subject: string; locale: string; status: string; error: string | null; provider_id: string | null; created_at: string };

export const dynamic = 'force-dynamic';

export default async function AdminMails() {
  const { data } = await getSupabaseAdmin()
    .from('email_log')
    .select('id, to_email, template, subject, locale, status, error, provider_id, created_at')
    .order('created_at', { ascending: false })
    .limit(200);
  const rows = (data ?? []) as Row[];
  const configured = !!process.env.RESEND_API_KEY;

  return (
    <div className="min-h-screen bg-[#F5F5F3] p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <AdminNav title="E-Mail-Protokoll" />
        {!configured && (
          <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
            RESEND_API_KEY ist nicht gesetzt. Mails werden nur protokolliert («skipped»), nicht gesendet.
          </p>
        )}
        <div className={`${card} overflow-hidden`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className={th}>Zeit</th><th className={th}>An</th><th className={th}>Vorlage</th><th className={th}>Betreff</th><th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-16 text-center text-sm text-gray-400">Noch keine Mails.</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                  <td className={`${td} text-xs text-gray-400 whitespace-nowrap`}>{dt(r.created_at)}</td>
                  <td className={`${td} text-gray-600`}>{r.to_email}</td>
                  <td className={`${td} font-mono text-xs`}>{r.template} <span className="text-gray-400">{r.locale}</span></td>
                  <td className={td}>{r.subject}</td>
                  <td className={td}>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${r.status === 'sent' ? 'bg-emerald-50 text-emerald-700' : r.status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{r.status}</span>
                    {r.error && <span className="block mt-1 max-w-xs truncate text-[10px] text-red-600" title={r.error}>{r.error}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
