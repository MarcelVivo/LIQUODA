import { supabaseAdmin } from '@/lib/supabase';
import LogoutButton from './_components/LogoutButton';

type Registration = {
  id: string;
  role: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
};

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const { data: rows } = await supabaseAdmin
    .from('registrations')
    .select('*')
    .order('created_at', { ascending: false });

  const registrations: Registration[] = rows ?? [];
  const total = registrations.length;
  const emittenten = registrations.filter((r) => r.role === 'Emittent').length;
  const investoren = registrations.filter((r) => r.role === 'Investor').length;

  return (
    <div className="min-h-screen bg-[#F5F5F3] p-6 md:p-10">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.35em] uppercase text-gray-400">
              LIQUODA Admin
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-[#0b1830]">
              Pre-Registrierungen
            </h1>
          </div>
          <LogoutButton />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Gesamt', value: total },
            { label: 'Emittenten', value: emittenten },
            { label: 'Investoren', value: investoren },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-gray-400">
                {s.label}
              </p>
              <p className="mt-2 text-4xl font-semibold text-[#0b1830]">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-6 py-4 text-[10px] font-semibold tracking-[0.25em] uppercase text-gray-400">
                  Name
                </th>
                <th className="text-left px-6 py-4 text-[10px] font-semibold tracking-[0.25em] uppercase text-gray-400">
                  E-Mail
                </th>
                <th className="text-left px-6 py-4 text-[10px] font-semibold tracking-[0.25em] uppercase text-gray-400">
                  Rolle
                </th>
                <th className="text-left px-6 py-4 text-[10px] font-semibold tracking-[0.25em] uppercase text-gray-400">
                  Datum
                </th>
              </tr>
            </thead>
            <tbody>
              {registrations.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-16 text-center text-sm text-gray-400"
                  >
                    Noch keine Registrierungen vorhanden.
                  </td>
                </tr>
              )}
              {registrations.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors"
                >
                  <td className="px-6 py-4 text-gray-800 font-medium">
                    {r.first_name} {r.last_name}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{r.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={[
                        'inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold',
                        r.role === 'Emittent'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-emerald-50 text-emerald-700',
                      ].join(' ')}
                    >
                      {r.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">
                    {new Date(r.created_at).toLocaleDateString('de-CH', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
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
