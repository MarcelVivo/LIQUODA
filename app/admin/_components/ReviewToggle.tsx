'use client';

import { useRouter } from 'next/navigation';

export default function ReviewToggle({ id, reviewed }: { id: string; reviewed: boolean }) {
  const router = useRouter();
  const toggle = async () => {
    await fetch('/api/admin/dokument-gesichtet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, reviewed: !reviewed }) });
    router.refresh();
  };
  return (
    <button type="button" onClick={toggle} className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${reviewed ? 'bg-emerald-50 text-emerald-700' : 'border border-gray-300 text-gray-500'}`}>
      {reviewed ? 'Gesichtet ✓' : 'Als gesichtet markieren'}
    </button>
  );
}
