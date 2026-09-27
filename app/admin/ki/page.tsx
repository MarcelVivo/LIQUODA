import { getSupabaseAdmin } from '@/lib/supabase';
import AdminNav from '../_components/AdminNav';
import { card, dt } from '../_lib';
import { hasKiEnv, KI_MODEL } from '@/lib/ki/client';

type Msg = { id: number; session_id: string; locale: string; role: string; content: string; created_at: string };
type Conv = { project_id: string; turns: number; updated_at: string; projects: { title: { de: string } } | null };
type Order = { id: string; project_id: string; status: string; amount_chf: number; created_at: string; projects: { title: { de: string } } | null };

export const dynamic = 'force-dynamic';

/** Übersicht KI: Support-Gespräche der Website, Assistenten-Nutzung, Bestellungen. */
export default async function AdminKi() {
  const admin = getSupabaseAdmin();
  const [{ data: msgs }, { data: convs }, { data: orders }] = await Promise.all([
    admin.from('ai_support_messages').select('id, session_id, locale, role, content, created_at').order('created_at', { ascending: false }).limit(400),
    admin.from('ai_conversations').select('project_id, turns, updated_at, projects(title)').order('updated_at', { ascending: false }).limit(50),
    admin.from('ai_orders').select('id, project_id, status, amount_chf, created_at, projects(title)').order('created_at', { ascending: false }).limit(50),
  ]);

  // Support-Nachrichten nach Sitzung gruppieren (neueste zuerst)
  const sessions = new Map<string, Msg[]>();
  for (const m of ((msgs ?? []) as Msg[]).slice().reverse()) {
    const list = sessions.get(m.session_id) ?? [];
    list.push(m);
    sessions.set(m.session_id, list);
  }
  const grouped = Array.from(sessions.values()).sort((a, b) => b[b.length - 1].created_at.localeCompare(a[a.length - 1].created_at));

  return (
    <div className="min-h-screen bg-[#F5F5F3] p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <AdminNav title="KI-Assistent und Support-Bot" />
        {!hasKiEnv() && (
          <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">ANTHROPIC_API_KEY ist nicht gesetzt. Assistent und Support-Bot sind ausgeschaltet.</p>
        )}
        <p className="mb-6 text-xs text-gray-500">Modell: <span className="font-mono">{KI_MODEL}</span> · Preis Assistent: CHF 190 einmalig je Projekt (Standard/Premium: Freischaltung über die Projektseite).</p>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className={`${card} p-6`}>
            <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-gray-400">Assistent je Projekt</p>
            {(convs ?? []).length === 0 ? <p className="mt-2 text-sm text-gray-400">Noch keine Gespräche.</p> : (
              <ul className="mt-3 divide-y divide-gray-100 text-sm">
                {((convs ?? []) as unknown as Conv[]).map((c) => (
                  <li key={c.project_id} className="flex items-center justify-between gap-3 py-2">
                    <a href={`/admin/projekte/${c.project_id}`} className="underline decoration-gray-300 underline-offset-4">{c.projects?.title?.de ?? c.project_id}</a>
                    <span className="text-xs text-gray-400">{c.turns} Nachrichten · {dt(c.updated_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className={`${card} p-6`}>
            <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-gray-400">Bestellungen (CHF 190)</p>
            {(orders ?? []).length === 0 ? <p className="mt-2 text-sm text-gray-400">Noch keine Bestellungen.</p> : (
              <ul className="mt-3 divide-y divide-gray-100 text-sm">
                {((orders ?? []) as unknown as Order[]).map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-3 py-2">
                    <a href={`/admin/projekte/${o.project_id}`} className="underline decoration-gray-300 underline-offset-4">{o.projects?.title?.de ?? o.project_id}</a>
                    <span className="text-xs text-gray-400">
                      <span className={`mr-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${o.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : o.status === 'open' ? 'bg-gray-100 text-gray-600' : 'bg-red-50 text-red-700'}`}>{o.status}</span>
                      CHF {Number(o.amount_chf)} · {dt(o.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className={`${card} mt-6 p-6`}>
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-gray-400">Support-Gespräche auf der Website ({grouped.length})</p>
          {grouped.length === 0 ? <p className="mt-2 text-sm text-gray-400">Noch keine Gespräche.</p> : (
            <div className="mt-3 space-y-4">
              {grouped.map((list) => (
                <details key={list[0].session_id} className="rounded-lg border border-gray-100 px-4 py-2">
                  <summary className="cursor-pointer text-sm">
                    <span className="text-xs text-gray-400">{dt(list[0].created_at)} · {list[0].locale} · {list.length} Nachrichten</span>
                    <span className="ml-2 text-gray-800">{list.find((m) => m.role === 'user')?.content.slice(0, 120)}</span>
                  </summary>
                  <ul className="mt-2 space-y-2 text-sm">
                    {list.map((m) => (
                      <li key={m.id} className={m.role === 'user' ? 'text-gray-900' : 'text-gray-600'}>
                        <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">{m.role === 'user' ? 'Besucher' : 'Bot'}</span>
                        <span className="whitespace-pre-wrap">{m.content}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
