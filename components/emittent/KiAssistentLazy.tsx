'use client';

import dynamic from 'next/dynamic';

// Der Assistent lädt erst im Browser (Streaming, Suchparameter); serverseitig bleibt die Seite schlank.
const KiAssistent = dynamic(() => import('./KiAssistent'), { ssr: false });

export default function KiAssistentLazy(props: { projectId: string; editable: boolean }) {
  return <KiAssistent {...props} />;
}
