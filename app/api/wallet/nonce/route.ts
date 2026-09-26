import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { getAccount, hasSupabaseEnv } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getOwnProfile } from '@/lib/investments';
import { normalizeAddress } from '@/lib/chain/token';
import { walletLinkMessage } from '@/lib/chain/wallet-message';

/** Schritt 1 der Wallet-Verknüpfung: Nonce erzeugen und zu signierende Nachricht liefern. */
export async function POST(req: NextRequest) {
  if (!hasSupabaseEnv()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  const account = await getAccount();
  if (!account) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const profile = await getOwnProfile(account.authId);
  if (!profile || profile.role !== 'investor') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const address = normalizeAddress(body.address);
  if (!address) return NextResponse.json({ error: 'invalid_address' }, { status: 400 });

  const nonce = randomBytes(16).toString('hex');
  const { error } = await getSupabaseAdmin().from('users').update({ wallet_nonce: nonce }).eq('id', profile.id);
  if (error) return NextResponse.json({ error: 'server' }, { status: 500 });

  return NextResponse.json({ message: walletLinkMessage({ address, nonce, email: profile.email }) });
}
