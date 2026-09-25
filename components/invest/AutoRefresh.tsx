'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Seite einige Male neu laden, solange die Webhook-Bestätigung aussteht. */
export default function AutoRefresh({ intervalMs = 3000, times = 10 }: { intervalMs?: number; times?: number }) {
  const router = useRouter();
  useEffect(() => {
    let count = 0;
    const id = window.setInterval(() => {
      count += 1;
      router.refresh();
      if (count >= times) window.clearInterval(id);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [router, intervalMs, times]);
  return null;
}
