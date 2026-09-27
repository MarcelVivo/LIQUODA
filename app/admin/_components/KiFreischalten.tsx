'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/** KI-Assistent manuell freischalten (Standard-/Premium-Paket) oder sperren. */
export default function KiFreischalten({ projectId, unlocked }: { projectId: string; unlocked: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const toggle = async () => {
    if (!window.confirm(unlocked ? 'KI-Assistent für dieses Projekt sperren?' : 'KI-Assistent für dieses Projekt ohne Zahlung freischalten (Paket)?')) return;
    setBusy(true);
    await fetch('/api/admin/ki-freischalten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, unlocked: !unlocked }),
    });
    setBusy(false);
    router.refresh();
  };
  return (
    <button type="button" onClick={toggle} disabled={busy} className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:border-gray-500 disabled:opacity-50">
      {unlocked ? 'Sperren' : 'Freischalten (Paket)'}
    </button>
  );
}
