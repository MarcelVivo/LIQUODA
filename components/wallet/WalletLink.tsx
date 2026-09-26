'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Wallet, CheckCircle } from 'lucide-react';
import { createWalletClient, custom, getAddress, type Address } from 'viem';
import Button from '@/components/ui/Button';
import { CHAIN_ID, EXPLORER_URL, getChain } from '@/lib/chain/config';

type EthereumProvider = { request: (args: { method: string; params?: unknown[] }) => Promise<unknown>; isMetaMask?: boolean };

/**
 * Wallet-Verknüpfung mit MetaMask: Adresse holen, Kette wechseln, Nachricht signieren,
 * Backend prüft die Signatur. Keine Transaktion, kein Gas.
 */
export default function WalletLink({ linkedAddress }: { linkedAddress: string | null }) {
  const t = useTranslations('wallet');
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const link = async () => {
    setError(undefined);
    const provider = (window as unknown as { ethereum?: EthereumProvider }).ethereum;
    if (!provider) {
      setError(t('errors.no_metamask'));
      return;
    }
    setBusy(true);
    try {
      const chain = getChain();
      const client = createWalletClient({ chain, transport: custom(provider) });
      const [raw] = await client.requestAddresses();
      const address = getAddress(raw) as Address;

      // Auf die Zielkette wechseln, bei Bedarf hinzufügen
      try {
        await client.switchChain({ id: CHAIN_ID });
      } catch {
        await client.addChain({ chain });
        await client.switchChain({ id: CHAIN_ID });
      }

      const nonceRes = await fetch('/api/wallet/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      const nonceData = await nonceRes.json().catch(() => ({}));
      if (!nonceRes.ok || !nonceData.message) {
        setError(t(nonceRes.status === 503 ? 'errors.not_configured' : 'errors.server'));
        return;
      }

      const signature = await client.signMessage({ account: address, message: nonceData.message as string });
      const verifyRes = await fetch('/api/wallet/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature }),
      });
      const verifyData = await verifyRes.json().catch(() => ({}));
      if (!verifyRes.ok) {
        const code = ['signature_invalid', 'wallet_taken', 'not_configured'].includes(verifyData.error) ? verifyData.error : 'server';
        setError(t(`errors.${code}`));
        return;
      }
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setError(/rejected|denied/i.test(msg) ? t('errors.rejected') : t('errors.server'));
    } finally {
      setBusy(false);
    }
  };

  if (linkedAddress) {
    return (
      <div className="text-xs text-navy">
        <p className="flex items-center gap-1.5">
          <CheckCircle size={14} className="text-accent" aria-hidden="true" />
          <a href={`${EXPLORER_URL}/address/${linkedAddress}`} target="_blank" rel="noopener" className="liq-link font-mono">
            {linkedAddress.slice(0, 6)}…{linkedAddress.slice(-4)}
          </a>
        </p>
        <button type="button" onClick={link} disabled={busy} className="liq-link mt-1 text-muted">
          {busy ? t('linking') : t('relink')}
        </button>
        {error && <p className="mt-1 text-red-700" role="alert">{error}</p>}
      </div>
    );
  }

  return (
    <div className="text-xs">
      <p className="text-muted">{t('lead')}</p>
      <div className="mt-2">
        <Button size="sm" onClick={link} disabled={busy}>
          <Wallet size={14} aria-hidden="true" />
          {busy ? t('linking') : t('link')}
        </Button>
      </div>
      {error && <p className="mt-2 text-red-700" role="alert">{error}</p>}
    </div>
  );
}
