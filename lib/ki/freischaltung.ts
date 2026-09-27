import { getSupabaseAdmin } from '@/lib/supabase';
import { getStripe } from '@/lib/stripe';

/** Preis des KI-Assistenten (Entscheid Marcel, 27.09.2026): CHF 190 einmalig je Projekt; im Standard- und Premium-Paket inbegriffen. */
export const AI_ASSISTANT_PRICE_CHF = 190;

/** Bestellung abschliessen: Status setzen und Projekt freischalten. Idempotent. */
export async function settleAiOrder(providerRef: string, outcome: 'paid' | 'expired' | 'failed'): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const { data: order } = await admin.from('ai_orders').select('id, project_id, status').eq('provider_ref', providerRef).maybeSingle();
  if (!order) return false;
  if (order.status !== 'open') return order.status === 'paid';
  await admin.from('ai_orders').update({ status: outcome }).eq('id', order.id).eq('status', 'open');
  if (outcome !== 'paid') return false;
  const { error } = await admin.from('projects').update({ ai_unlocked_at: new Date().toISOString() }).eq('id', order.project_id).is('ai_unlocked_at', null);
  if (error) console.error('[ki/freischaltung] unlock:', error.message);
  await admin.from('audit_log').insert({ entity: 'projects', entity_id: order.project_id, action: 'ai_unlocked', old_value: null, new_value: 'paid', actor_label: 'system:stripe' });
  return !error;
}

/** Offene Bestellungen eines Projekts direkt bei Stripe nachfragen (Ersatz für einen verspäteten Webhook). */
export async function settleOpenAiOrders(projectId: string): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const { data: orders } = await admin.from('ai_orders').select('provider_ref').eq('project_id', projectId).eq('status', 'open');
  let unlocked = false;
  for (const o of orders ?? []) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(o.provider_ref);
      if (session.payment_status === 'paid') unlocked = (await settleAiOrder(o.provider_ref, 'paid')) || unlocked;
      else if (session.status === 'expired') await settleAiOrder(o.provider_ref, 'expired');
    } catch (err) {
      console.error('[ki/freischaltung] stripe retrieve:', err instanceof Error ? err.message : err);
    }
  }
  return unlocked;
}
