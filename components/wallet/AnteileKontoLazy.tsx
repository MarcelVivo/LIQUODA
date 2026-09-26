'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';

/**
 * Lädt Privy und das Anteile-Konto erst im Browser (kein Server-Rendering des grossen SDK).
 * Die übrige Portfolio-Seite bleibt schlank.
 */
const PrivyRoot = dynamic(() => import('@/components/wallet/PrivyRoot'), { ssr: false });
const AnteileKonto = dynamic(() => import('@/components/wallet/AnteileKonto'), {
  ssr: false,
  loading: () => <LoadingHint />,
});

function LoadingHint() {
  const t = useTranslations('wallet.embedded');
  return (
    <p className="flex items-center gap-1.5 text-xs text-muted" role="status">
      <Loader2 size={14} className="animate-spin text-accent" aria-hidden="true" />
      {t('settingUp')}
    </p>
  );
}

export default function AnteileKontoLazy({ linkedAddress }: { linkedAddress: string | null }) {
  return (
    <PrivyRoot>
      <AnteileKonto linkedAddress={linkedAddress} />
    </PrivyRoot>
  );
}
