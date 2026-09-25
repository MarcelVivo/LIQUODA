import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getStripe, hasStripeEnv } from '@/lib/stripe';

/**
 * Stripe-Webhook (Spec, Abschnitt 7, Schritt 4): bestätigt die Zahlung,
 * speichert die Zahlungsreferenz und setzt die Investition reserved -> paid.
 * Abgelaufene oder fehlgeschlagene Checkouts werden auf cancelled gesetzt.
 * Idempotent: bereits verarbeitete Sessions ändern nichts mehr.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!hasStripeEnv() || !secret) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const signature = req.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'missing_signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    const payload = await req.text();
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    console.error('[investieren/webhook] signature:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const settle = async (session: Stripe.Checkout.Session, outcome: 'paid' | 'cancelled', refStatus: string) => {
    const investmentId = session.metadata?.investment_id ?? session.client_reference_id;
    if (!investmentId) return;

    await admin
      .from('payment_references')
      .update({ status: refStatus })
      .eq('provider', 'stripe')
      .eq('provider_ref', session.id);

    // Nur reservierte Investitionen wechseln; alles andere ist bereits verarbeitet
    const { error } = await admin
      .from('investments')
      .update({ status: outcome })
      .eq('id', investmentId)
      .eq('status', 'reserved');
    if (error) console.error('[investieren/webhook] update:', error.message);
  };

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      if (session.payment_status === 'paid') await settle(session, 'paid', 'paid');
      break;
    }
    case 'checkout.session.async_payment_succeeded':
      await settle(event.data.object, 'paid', 'paid');
      break;
    case 'checkout.session.async_payment_failed':
      await settle(event.data.object, 'cancelled', 'failed');
      break;
    case 'checkout.session.expired':
      await settle(event.data.object, 'cancelled', 'expired');
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
