/**
 * Serverseitiger Datenzugriff für den Investitionsprozess (Etappe 4).
 * Schreibzugriffe laufen über den Service-Role-Client; die Datenbank-Trigger
 * prüfen Kapazität, KYC, Betrag und Statuswechsel zusätzlich.
 */
import { getSupabaseAdmin } from '@/lib/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type InvestmentStatus = 'reserved' | 'paid' | 'confirmed' | 'cancelled' | 'refunded';

export interface InvestorProfile {
  id: string;
  role: 'investor' | 'emittent' | 'admin';
  kyc_status: 'pending' | 'approved' | 'rejected';
  email: string;
  name: string;
}

export interface InvestmentRow {
  id: string;
  project_id: string;
  investor_id: string;
  amount_chf: number | string;
  status: InvestmentStatus;
  created_at: string;
}

export interface PaymentReferenceRow {
  id: string;
  investment_id: string;
  provider: string;
  provider_ref: string;
  status: string;
  amount_chf: number | string;
}

/** Profil des eingeloggten Nutzers (RLS: nur eigene Zeile). */
export async function getOwnProfile(authId: string): Promise<InvestorProfile | null> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from('users')
    .select('id, role, kyc_status, email, name')
    .eq('auth_id', authId)
    .maybeSingle();
  return (data as InvestorProfile | null) ?? null;
}

/** Noch offener Betrag eines Projekts (bezahlt/bestätigt plus frische Reservationen). */
export async function getOpenAmountChf(projectId: string, targetAmountChf: number): Promise<number> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.rpc('committed_amount_chf', { p_project_id: projectId });
  if (error) {
    console.error('[investments] committed_amount_chf:', error.message);
    return 0;
  }
  return Math.max(0, targetAmountChf - Number(data ?? 0));
}

/** Investition samt Zahlungsreferenz zu einer Stripe-Session, nur für den Eigentümer. */
export async function getInvestmentBySession(
  sessionId: string,
  investorId: string
): Promise<{ investment: InvestmentRow; payment: PaymentReferenceRow } | null> {
  const admin = getSupabaseAdmin();
  const { data: payment } = await admin
    .from('payment_references')
    .select('id, investment_id, provider, provider_ref, status, amount_chf')
    .eq('provider', 'stripe')
    .eq('provider_ref', sessionId)
    .maybeSingle();
  if (!payment) return null;
  const { data: investment } = await admin
    .from('investments')
    .select('id, project_id, investor_id, amount_chf, status, created_at')
    .eq('id', payment.investment_id)
    .eq('investor_id', investorId)
    .maybeSingle();
  if (!investment) return null;
  return { investment: investment as InvestmentRow, payment: payment as PaymentReferenceRow };
}

/** Reservation abbrechen (Abbruchseite). Nur eigene, nur solange reserviert. */
export async function cancelReservedInvestment(investmentId: string, investorId: string): Promise<void> {
  const admin = getSupabaseAdmin();
  await admin
    .from('investments')
    .update({ status: 'cancelled' })
    .eq('id', investmentId)
    .eq('investor_id', investorId)
    .eq('status', 'reserved');
}

export interface PortfolioInvestment {
  id: string;
  amount_chf: number | string;
  status: InvestmentStatus;
  created_at: string;
  project: { slug: string; title: { de: string; en?: string } } | null;
}

/** Eigene Beteiligungen für das Portfolio (RLS: nur eigene). */
export async function listOwnInvestments(): Promise<PortfolioInvestment[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('investments')
    .select('id, amount_chf, status, created_at, project:projects(slug, title)')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[investments] list:', error.message);
    return [];
  }
  return (data ?? []) as unknown as PortfolioInvestment[];
}
