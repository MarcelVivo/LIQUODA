import { NextRequest, NextResponse } from 'next/server';
import { getAccount, hasSupabaseEnv } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getProjectBySlug, publicStatus } from '@/lib/projects';
import { daysUntil } from '@/lib/format';
import { getOpenAmountChf, getOwnProfile } from '@/lib/investments';
import { getStripe, hasStripeEnv, investorFeeChf, MAX_INVESTMENT_CHF } from '@/lib/stripe';
import { requestOrigin } from '@/app/api/konto/_lib';

const CONSENTS = ['risks', 'loss', 'lock', 'role', 'refund'] as const;
const CHECKOUT_MINUTES = 30;

/**
 * Schritt 3 des Investitionsflows (Spec, Abschnitt 7):
 * Investition als «reserved» anlegen und Stripe-Checkout-Session erstellen.
 * Alle Prüfungen laufen serverseitig; die Datenbank-Trigger prüfen zusätzlich.
 */
export async function POST(req: NextRequest) {
  if (!hasSupabaseEnv() || !hasStripeEnv()) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  const account = await getAccount();
  if (!account) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const slug = typeof body.slug === 'string' ? body.slug : '';
  const locale = body.locale === 'en' ? 'en' : 'de';
  const amount = typeof body.amount === 'number' ? body.amount : Number(body.amount);
  const consents = (body.consents ?? {}) as Record<string, unknown>;
  if (!CONSENTS.every((key) => consents[key] === true)) {
    return NextResponse.json({ error: 'consent_missing' }, { status: 400 });
  }

  const profile = await getOwnProfile(account.authId);
  if (!profile || profile.role !== 'investor') {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 403 });
  }
  if (profile.kyc_status !== 'approved') {
    return NextResponse.json({ error: 'kyc_not_approved' }, { status: 403 });
  }

  const project = await getProjectBySlug(slug);
  if (!project || publicStatus(project) !== 'open' || daysUntil(project.deadline) < 0) {
    return NextResponse.json({ error: 'project_not_open' }, { status: 409 });
  }

  const open = await getOpenAmountChf(project.id, project.targetAmountChf);
  if (
    !Number.isInteger(amount) ||
    amount < project.minInvestmentChf ||
    amount > MAX_INVESTMENT_CHF ||
    amount > open
  ) {
    return NextResponse.json({ error: 'amount_invalid', open }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: investment, error: insertError } = await admin
    .from('investments')
    .insert({ project_id: project.id, investor_id: profile.id, amount_chf: amount, status: 'reserved' })
    .select('id')
    .single();
  if (insertError || !investment) {
    console.error('[investieren/checkout] insert:', insertError?.message);
    // Trigger-Fehler (Kapazität, KYC, Betrag) sachlich zurückmelden
    const msg = insertError?.message ?? '';
    const code = msg.includes('amount') ? 'amount_invalid' : msg.includes('kyc') ? 'kyc_not_approved' : msg.includes('project') ? 'project_not_open' : 'server';
    return NextResponse.json({ error: code }, { status: 409 });
  }

  const fee = investorFeeChf(amount);
  const origin = requestOrigin(req);
  const prefix = locale === 'en' ? '/en' : '';
  const base = `${origin}${prefix}/investieren/${project.slug}`;
  const title = project.title[locale] ?? project.title.de;

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      currency: 'chf',
      customer_email: profile.email,
      client_reference_id: investment.id,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'chf',
            unit_amount: amount * 100,
            product_data: { name: title, description: locale === 'en' ? 'Participation amount' : 'Beteiligungsbetrag' },
          },
        },
        {
          quantity: 1,
          price_data: {
            currency: 'chf',
            unit_amount: Math.round(fee * 100),
            product_data: {
              name: locale === 'en' ? 'LIQUODA transaction fee (1 %)' : 'Transaktionsgebühr LIQUODA (1 %)',
            },
          },
        },
      ],
      metadata: { investment_id: investment.id, project_id: project.id, investor_id: profile.id },
      success_url: `${base}/bestaetigung?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/abgebrochen?inv=${investment.id}`,
      expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_MINUTES * 60,
    });

    const { error: refError } = await admin.from('payment_references').insert({
      investment_id: investment.id,
      provider: 'stripe',
      provider_ref: session.id,
      status: session.status ?? 'open',
      amount_chf: amount + fee,
    });
    if (refError) console.error('[investieren/checkout] payment_reference:', refError.message);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[investieren/checkout] stripe:', err instanceof Error ? err.message : err);
    await admin.from('investments').update({ status: 'cancelled' }).eq('id', investment.id).eq('status', 'reserved');
    return NextResponse.json({ error: 'server' }, { status: 502 });
  }
}
