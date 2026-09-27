'use client';

import { useRouter } from 'next/navigation';

export default function ModerationButtons({ type, id, hidden }: { type: 'update' | 'question'; id: string; hidden: boolean }) {
  const router = useRouter();
  const act = async (action: 'hide' | 'show' | 'delete') => {
    if (action === 'delete' && !window.confirm('Endgültig löschen?')) return;
    await fetch('/api/admin/moderation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, id, action }) });
    router.refresh();
  };
  return (
    <span className="flex gap-2 text-[10px]">
      <button type="button" onClick={() => act(hidden ? 'show' : 'hide')} className="underline text-gray-500">{hidden ? 'Einblenden' : 'Ausblenden'}</button>
      <button type="button" onClick={() => act('delete')} className="underline text-red-600">Löschen</button>
    </span>
  );
}
