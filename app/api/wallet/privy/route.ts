import { NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';
import { getAccount, hasSupabaseEnv } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getOwnProfile } from '@/lib/investments';
import { normalizeAddress } from '@/lib/chain/token';

/**
 * Eingebettete Wallet (Privy) mit dem LIQUODA-Konto verknüpfen.
 * Die Adresse wird nicht vom Browser übernommen, sondern serverseitig bei Privy
 * anhand der Supabase-Nutzer-ID (JWT «sub») nachgeschlagen.
 */
export async function POST() {
  if (!hasSupabaseEnv()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  if (!appId || !appSecret) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const account = await getAccount();
  if (!account) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const profile = await getOwnProfile(account.authId);
  if (!profile || profile.role !== 'investor') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const privy = new PrivyClient(appId, appSecret);
  const privyUser = await privy.getUserByCustomAuthId(account.authId).catch((err) => {
    console.error('[wallet/privy] lookup:', err instanceof Error ? err.message : err);
    return null;
  });
  if (!privyUser) return NextResponse.json({ error: 'no_privy_user' }, { status: 404 });

  const embedded =
    privyUser.linkedAccounts.find(
      (a) => a.type === 'wallet' && a.walletClientType === 'privy' && a.chainType === 'ethereum'
    ) ?? null;
  const address = normalizeAddress(embedded && 'address' in embedded ? embedded.address : privyUser.wallet?.address);
  if (!address) return NextResponse.json({ error: 'no_wallet' }, { status: 404 });

  const admin = getSupabaseAdmin();
  const { data: taken } = await admin.from('users').select('id').eq('wallet_address', address).neq('id', profile.id).maybeSingle();
  if (taken) return NextResponse.json({ error: 'wallet_taken' }, { status: 409 });

  const { error } = await admin
    .from('users')
    .update({ wallet_address: address, wallet_nonce: null, wallet_linked_at: new Date().toISOString() })
    .eq('id', profile.id)
    .neq('wallet_address', address);
  if (error) {
    console.error('[wallet/privy] save:', error.message);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
  return NextResponse.json({ success: true, address });
}
