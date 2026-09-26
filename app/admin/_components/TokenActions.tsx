'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function DeployTokenButton({ projectId, disabled }: { projectId: string; disabled?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const run = async () => {
    if (!window.confirm('Token-Vertrag auf Polygon Amoy anlegen? Cap = Zielbetrag, 1 Token = CHF 1.')) return;
    setBusy(true);
    setMsg('Deployment läuft, das dauert einige Sekunden …');
    const res = await fetch('/api/admin/token/deploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error === 'insufficient_funds' ? 'Backend-Wallet hat kein Testnet-Guthaben (POL).' : data.error === 'not_configured' ? 'Blockchain-Variablen fehlen.' : `Fehler: ${data.message ?? data.error}`);
      return;
    }
    setMsg(`Vertrag ${data.address} angelegt, ${data.anchored} Dokument-Hash(es) verankert.`);
    router.refresh();
  };

  return (
    <div>
      <button type="button" onClick={run} disabled={busy || disabled} className="rounded-lg bg-[#0b1830] px-3 py-2 text-xs font-semibold tracking-wide text-white disabled:opacity-50">
        {busy ? 'Wird angelegt …' : 'Token-Vertrag anlegen'}
      </button>
      {msg && <p className="mt-2 text-xs text-gray-600">{msg}</p>}
    </div>
  );
}

export function MintButton({ investmentId, disabled, hint }: { investmentId: string; disabled?: boolean; hint?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const run = async () => {
    if (!window.confirm('Mint freigeben? Die Token werden in die Wallet des Investors übertragen.')) return;
    setBusy(true);
    setMsg('Mint läuft …');
    const res = await fetch('/api/admin/token/mint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ investmentId }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      const problems = Array.isArray(data.problems) ? data.problems.join(', ') : '';
      setMsg(data.error === 'preconditions' ? `Voraussetzungen fehlen: ${problems}` : data.error === 'insufficient_funds' ? 'Backend-Wallet hat kein Testnet-Guthaben (POL).' : `Fehler: ${data.message ?? data.error}`);
      return;
    }
    setMsg(`Mint bestätigt: ${data.txHash}`);
    router.refresh();
  };

  return (
    <div>
      <button type="button" onClick={run} disabled={busy || disabled} title={hint} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-40">
        {busy ? 'Mint …' : 'Mint freigeben'}
      </button>
      {msg && <p className="mt-1 max-w-xs break-all text-[10px] text-gray-600">{msg}</p>}
    </div>
  );
}
