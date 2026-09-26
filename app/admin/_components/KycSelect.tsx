'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const OPTIONS = [
  { value: 'pending', label: 'Ausstehend' },
  { value: 'approved', label: 'Bestätigt' },
  { value: 'rejected', label: 'Nicht bestanden' },
];

export default function KycSelect({ userId, value }: { userId: string; value: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const change = async (status: string) => {
    if (status === value) return;
    setBusy(true);
    setError('');
    const res = await fetch('/api/admin/kyc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, status }),
    });
    setBusy(false);
    if (!res.ok) {
      setError('Fehler beim Speichern');
      return;
    }
    router.refresh();
  };

  return (
    <div>
      <select
        value={value}
        disabled={busy}
        onChange={(e) => change(e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-800 focus:border-[#0b1830] focus:outline-none"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-[10px] text-red-600">{error}</p>}
    </div>
  );
}
