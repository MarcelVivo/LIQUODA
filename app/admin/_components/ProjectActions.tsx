'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Action = { status: 'active' | 'draft' | 'cancelled' | 'failed'; label: string; needsNote: boolean; confirm: string };

const ACTIONS: Record<string, Action[]> = {
  in_review: [
    { status: 'active', label: 'Freigeben (sofort live)', needsNote: false, confirm: 'Projekt freigeben? Es wird sofort im Marktplatz sichtbar.' },
    { status: 'draft', label: 'Rückfrage, zurück an Emittent', needsNote: true, confirm: 'Projekt mit Rückfrage an den Emittenten zurückgeben?' },
  ],
  active: [
    { status: 'cancelled', label: 'Vorzeitig beenden', needsNote: true, confirm: 'Projekt vorzeitig beenden? Neue Beteiligungen sind dann nicht mehr möglich.' },
    { status: 'failed', label: 'Als nicht erfolgreich beenden', needsNote: true, confirm: 'Projekt als «Finanzierung nicht erfolgreich» markieren?' },
  ],
  draft: [{ status: 'cancelled', label: 'Entwurf beenden', needsNote: true, confirm: 'Entwurf beenden?' }],
};

export default function ProjectActions({ projectId, status }: { projectId: string; status: string }) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const actions = ACTIONS[status] ?? [];

  if (actions.length === 0) {
    return <p className="text-xs text-gray-400">Keine Aktionen für diesen Status.</p>;
  }

  const run = async (a: Action) => {
    if (a.needsNote && !note.trim()) {
      setError('Bitte eine Begründung eintragen.');
      return;
    }
    if (!window.confirm(a.confirm)) return;
    setBusy(true);
    setError('');
    const res = await fetch('/api/admin/projekt-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, status: a.status, note }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.message ?? 'Fehler');
      return;
    }
    setNote('');
    router.refresh();
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-gray-500">
        Begründung / Rückfrage an den Emittenten
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-[#0b1830] focus:outline-none"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <button
            key={a.status}
            type="button"
            onClick={() => run(a)}
            disabled={busy}
            className={[
              'rounded-lg px-3 py-2 text-xs font-semibold tracking-wide transition-opacity disabled:opacity-50',
              a.status === 'active' ? 'bg-emerald-600 text-white' : 'border border-gray-300 bg-white text-gray-700',
            ].join(' ')}
          >
            {a.label}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
