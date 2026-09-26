import { NextRequest, NextResponse } from 'next/server';
import { verifyMessage, type Hex } from 'viem';
import { getAccount, hasSupabaseEnv } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getOwnProfile } from '@/lib/investments';
import { normalizeAddress } from '@/lib/chain/token';
import { walletLinkMessage } from '@/lib/chain/wallet-message';

/** Schritt 2: Signatur prüfen, Adresse speichern (Spec, Abschnitt 4, Investor Schritt 4). */
export async function POST(req: NextRequest) {
  if (!hasSupabaseEnv()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  const account = await getAccount();
  if (!account) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const profile = await getOwnProfile(account.authId);
  if (!profile || profile.role !== 'investor') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const address = normalizeAddress(body.address);
  const signature = typeof body.signature === 'string' && /^0x[0-9a-fA-F]{130}$/.test(body.signature) ? (body.signature as Hex) : null;
  if (!address || !signature) return NextResponse.json({ error: 'validation' }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { data: row } = await admin.from('users').select('wallet_nonce').eq('id', profile.id).maybeSingle();
  const nonce = row?.wallet_nonce as string | null;
  if (!nonce) return NextResponse.json({ error: 'nonce_missing' }, { status: 400 });

  const message = walletLinkMessage({ address, nonce, email: profile.email });
  const valid = await verifyMessage({ address, message, signature }).catch(() => false);
  if (!valid) return NextResponse.json({ error: 'signature_invalid' }, { status: 400 });

  // Eine Wallet gehört zu genau einem Konto
  const { data: taken } = await admin.from('users').select('id').eq('wallet_address', address).neq('id', profile.id).maybeSingle();
  if (taken) return NextResponse.json({ error: 'wallet_taken' }, { status: 409 });

  const { error } = await admin
    .from('users')
    .update({ wallet_address: address, wallet_nonce: null, wallet_linked_at: new Date().toISOString() })
    .eq('id', profile.id);
  if (error) {
    console.error('[wallet/verify]', error.message);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
  return NextResponse.json({ success: true, address });
}
