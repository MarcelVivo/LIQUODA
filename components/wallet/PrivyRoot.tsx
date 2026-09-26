'use client';

import { useMemo, type ReactNode } from 'react';
import { PrivyProvider, useSyncJwtBasedAuthState } from '@privy-io/react-auth';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { getChain } from '@/lib/chain/config';

/**
 * Eingebettete Wallet (Etappe 7): Privy übernimmt das bestehende Supabase-Login per JWT.
 * Der Investor meldet sich nicht ein zweites Mal an; beim ersten Besuch entsteht
 * automatisch ein Anteile-Konto (Embedded Wallet). LIQUODA hält keine Schlüssel.
 */
function SupabaseJwtSync({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  useSyncJwtBasedAuthState({
    subscribe: (onChange) => {
      const { data } = supabase.auth.onAuthStateChange(() => onChange());
      return () => data.subscription.unsubscribe();
    },
    getExternalJwt: async () => {
      try {
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token ?? undefined;
      } catch {
        return undefined;
      }
    },
  });
  return <>{children}</>;
}

export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? '';

export default function PrivyRoot({ children }: { children: ReactNode }) {
  if (!PRIVY_APP_ID) return <>{children}</>;
  const chain = getChain();
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: [],
        embeddedWallets: { ethereum: { createOnLogin: 'all-users' } },
        defaultChain: chain,
        supportedChains: [chain],
        appearance: { theme: 'light', accentColor: '#1FA88C' },
      }}
    >
      <SupabaseJwtSync>{children}</SupabaseJwtSync>
    </PrivyProvider>
  );
}
