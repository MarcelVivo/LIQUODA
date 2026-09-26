'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { CheckCircle, Loader2 } from 'lucide-react';
import { EXPLORER_URL } from '@/lib/chain/config';
import WalletLink from '@/components/wallet/WalletLink';
import { PRIVY_APP_ID } from '@/components/wallet/PrivyRoot';

/**
 * Anteile-Konto des Investors. Mit Privy wird es automatisch eingerichtet und
 * mit dem LIQUODA-Konto verknüpft; ohne Privy bleibt MetaMask als Weg.
 */
export default function AnteileKonto({ linkedAddress }: { linkedAddress: string | null }) {
  if (!PRIVY_APP_ID) return <WalletLink linkedAddress={linkedAddress} />;
  return <PrivyKonto linkedAddress={linkedAddress} />;
}

function PrivyKonto({ linkedAddress }: { linkedAddress: string | null }) {
  const t = useTranslations('wallet.embedded');
  const router = useRouter();
  const { ready, authenticated, user } = usePrivy();
  const [error, setError] = useState<string | undefined>();
  const [showDetails, setShowDetails] = useState(false);
  const linking = useRef(false);

  // Wallet-Adresse aus dem Privy-Zustand (Embedded Wallet kann unter «wallet» oder in linkedAccounts liegen)
  const embedded = user?.linkedAccounts.find(
    (a) => a.type === 'wallet' && a.walletClientType === 'privy' && a.chainType === 'ethereum'
  );
  const walletAddress = (embedded && 'address' in embedded ? embedded.address : user?.wallet?.address) ?? null;
  const needsLink = !linkedAddress || (!!walletAddress && walletAddress.toLowerCase() !== linkedAddress.toLowerCase());
  const [attempt, setAttempt] = useState(0);

  // Sobald Privy die Anmeldung kennt, die Adresse serverseitig nachschlagen und verknüpfen.
  // Der Server fragt Privy direkt; der Browser liefert keine Adresse. Bei «noch keine Wallet» wird kurz erneut versucht.
  useEffect(() => {
    if (!ready || !authenticated || !needsLink || linking.current) return;
    linking.current = true;
    fetch('/api/wallet/privy', { method: 'POST' })
      .then(async (res) => {
        if (res.ok) {
          router.refresh();
          return;
        }
        const data = await res.json().catch(() => ({}));
        if ((data.error === 'no_wallet' || data.error === 'no_privy_user') && attempt < 10) {
          window.setTimeout(() => setAttempt((n) => n + 1), 2000);
          return;
        }
        setError(t(data.error === 'not_configured' ? 'errors.not_configured' : 'errors.server'));
      })
      .catch(() => setError(t('errors.server')))
      .finally(() => {
        linking.current = false;
      });
  }, [ready, authenticated, needsLink, attempt, router, t]);

  if (linkedAddress && !needsLink) {
    return (
      <div className="text-xs text-navy">
        <p className="flex items-center gap-1.5">
          <CheckCircle size={14} className="text-accent" aria-hidden="true" />
          {t('ready')}
        </p>
        <button type="button" onClick={() => setShowDetails((v) => !v)} className="liq-link mt-1 text-muted">
          {showDetails ? t('hideDetails') : t('showDetails')}
        </button>
        {showDetails && (
          <p className="mt-1 text-muted">
            {t('addressLabel')}{' '}
            <a href={`${EXPLORER_URL}/address/${linkedAddress}`} target="_blank" rel="noopener" className="liq-link font-mono">
              {linkedAddress.slice(0, 6)}…{linkedAddress.slice(-4)}
            </a>
          </p>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-xs text-red-700" role="alert">
        {error}
      </p>
    );
  }

  return (
    <p className="flex items-center gap-1.5 text-xs text-muted" role="status">
      <Loader2 size={14} className="animate-spin text-accent" aria-hidden="true" />
      {t('settingUp')}
    </p>
  );
}
