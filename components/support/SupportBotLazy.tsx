'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

const SupportBot = dynamic(() => import('./SupportBot'), { ssr: false });

/** Support-Bot auf allen öffentlichen Seiten; nicht im Projekt-Wizard (dort arbeitet der KI-Assistent). */
export default function SupportBotLazy({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  if (!enabled || /\/emittent\/projekte\//.test(pathname)) return null;
  return <SupportBot />;
}
