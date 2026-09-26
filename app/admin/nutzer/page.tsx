import { getSupabaseAdmin } from '@/lib/supabase';
import AdminNav from '../_components/AdminNav';
import KycSelect from '../_components/KycSelect';
import { card, td, th, dt } from '../_lib';

type UserRow = { id: string; name: string; email: string; role: string; kyc_status: string; wallet_address: string | null; created_at: string };

export const dynamic = 'force-dynamic';

export default async function AdminUsers() {
  const { data } = await getSupabaseAdmin()
    .from('users')
    .select('id, name, email, role, kyc_status, wallet_address, created_at')
    .order('created_at', { ascending: false });
  const users: UserRow[] = (data ?? []) as UserRow[];

  return (
    <div className="min-h-screen bg-[#F5F5F3] p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <AdminNav title="Nutzer und KYC/KYB" />
        <div className={`${card} overflow-hidden`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className={th}>Name</th><th className={th}>E-Mail</th><th className={th}>Rolle</th><th className={th}>KYC / KYB</th><th className={th}>Wallet</th><th className={th}>Seit</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-sm text-gray-400">Noch keine Nutzer.</td></tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                  <td className={`${td} font-medium`}>{u.name}</td>
                  <td className={`${td} text-gray-500`}>{u.email}</td>
                  <td className={td}>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${u.role === 'emittent' ? 'bg-blue-50 text-blue-700' : u.role === 'admin' ? 'bg-gray-800 text-white' : 'bg-emerald-50 text-emerald-700'}`}>{u.role}</span>
                  </td>
                  <td className={td}><KycSelect userId={u.id} value={u.kyc_status} /></td>
                  <td className={`${td} font-mono text-xs text-gray-500`}>{u.wallet_address ? `${u.wallet_address.slice(0, 8)}…` : '–'}</td>
                  <td className={`${td} text-xs text-gray-400`}>{dt(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-gray-400">Jede Änderung des KYC/KYB-Status wird im Audit-Log mit deiner Admin-Kennung festgehalten.</p>
      </div>
    </div>
  );
}
