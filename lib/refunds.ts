import 'server-only';
import type Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getStripe, hasStripeEnv } from '@/lib/stripe';
import { hasChainEnv, pauseToken } from '@/lib/chain/token';
import { notifyInvestmentRefunded } from '@/lib/email/notify';

/**
 * Rückabwicklung (Spec, Abschnitt 7): Scheitert die Finanzierung oder wird ein Projekt
 * vorzeitig beendet, werden alle bezahlten Beteiligungen vollständig erstattet
 * (Beteiligungsbetrag plus Gebühr). Idempotent über den Stripe-Idempotency-Key.
 */

export interface RefundResult {
  investmentId: string;
  ok: boolean;
  refundId?: string;
  error?: string;
}

type InvestmentRow = {
  id: string;
  status: string;
  amount_chf: number | string;
  project_id: string;
  payment_references: { provider: string; provider_ref: string; status: string; amount_chf: number | string }[];
};

async function findPaymentIntent(stripe: Stripe, refs: InvestmentRow['payment_references']): Promise<string | null> {
  const payment = refs.find((r) => r.provider === 'stripe' && r.status === 'paid') ?? refs.find((r) => r.provider === 'stripe');
  if (!payment) return null;
  if (payment.provider_ref.startsWith('pi_')) return payment.provider_ref;
  const session = await stripe.checkout.sessions.retrieve(payment.provider_ref);
  return typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null;
}

/** Eine Beteiligung erstatten. Setzt status refunded und protokolliert; Fehler werden festgehalten. */
export async function refundInvestment(investmentId: string, actor: string): Promise<RefundResult> {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from('investments')
    .select('id, status, amount_chf, project_id, payment_references(provider, provider_ref, status, amount_chf)')
    .eq('id', investmentId)
    .maybeSingle();
  const inv = data as InvestmentRow | null;
  if (!inv) return { investmentId, ok: false, error: 'not_found' };
  if (!['paid', 'confirmed'].includes(inv.status)) return { investmentId, ok: false, error: `status_${inv.status}` };
  if (!hasStripeEnv()) {
    await admin.rpc('backend_refund_failed', { p_investment_id: inv.id, p_error: 'STRIPE_SECRET_KEY missing' });
    return { investmentId, ok: false, error: 'not_configured' };
  }

  try {
    const stripe = getStripe();
    const paymentIntent = await findPaymentIntent(stripe, inv.payment_references ?? []);
    if (!paymentIntent) throw new Error('no payment reference');

    const refund = await stripe.refunds.create(
      { payment_intent: paymentIntent, reason: 'requested_by_customer', metadata: { investment_id: inv.id, project_id: inv.project_id } },
      { idempotencyKey: `refund-${inv.id}` }
    );
    if (refund.status === 'failed' || refund.status === 'canceled') throw new Error(`refund ${refund.status}: ${refund.failure_reason ?? ''}`);

    const { error } = await admin.rpc('backend_refund_investment', {
      p_investment_id: inv.id,
      p_provider_ref: refund.id,
      p_amount_chf: refund.amount / 100,
      p_actor: actor,
    });
    if (error) throw new Error(error.message);

    notifyInvestmentRefunded(inv.id, refund.amount / 100).catch((e) => console.error('[email]', e));
    return { investmentId, ok: true, refundId: refund.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown';
    console.error('[refunds]', inv.id, message);
    await admin.rpc('backend_refund_failed', { p_investment_id: inv.id, p_error: message });
    return { investmentId, ok: false, error: message };
  }
}

/** Alle bezahlten Beteiligungen eines gescheiterten oder beendeten Projekts erstatten; Register pausieren. */
export async function processProjectRefunds(projectId: string, actor: string): Promise<RefundResult[]> {
  const admin = getSupabaseAdmin();
  const { data: project } = await admin
    .from('projects')
    .select('id, status, token_contract_address')
    .eq('id', projectId)
    .maybeSingle();
  if (!project || !['failed', 'cancelled'].includes(project.status)) return [];

  const { data: invs } = await admin
    .from('investments')
    .select('id')
    .eq('project_id', projectId)
    .in('status', ['paid', 'confirmed']);

  const results: RefundResult[] = [];
  for (const inv of invs ?? []) {
    results.push(await refundInvestment(inv.id, actor));
  }

  // Register pausieren, damit bereits zugewiesene Anteile nicht mehr übertragbar sind
  if (project.token_contract_address && hasChainEnv()) {
    try {
      await pauseToken(project.token_contract_address as `0x${string}`);
    } catch (err) {
      console.error('[refunds] pause:', err instanceof Error ? err.message : err);
    }
  }
  return results;
}

/** Tageslauf: Rückstände aus dem nächtlichen Datenbank-Job und fehlgeschlagene Versuche nachholen. */
export async function processRefundBacklog(actor: string): Promise<RefundResult[]> {
  const admin = getSupabaseAdmin();
  const { data } = await admin.from('refund_backlog').select('project_id');
  const projectIds = Array.from(new Set((data ?? []).map((r) => r.project_id as string)));
  const results: RefundResult[] = [];
  for (const id of projectIds) results.push(...(await processProjectRefunds(id, actor)));
  return results;
}
