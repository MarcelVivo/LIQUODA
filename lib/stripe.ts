import Stripe from 'stripe';

/** Stripe im Testmodus (Spec, Abschnitt 5). Ohne Schlüssel bleibt der Checkout deaktiviert. */
export function hasStripeEnv(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY ist nicht gesetzt.');
  if (!stripe) stripe = new Stripe(key, { typescript: true });
  return stripe;
}

export { INVESTOR_FEE_RATE, MAX_INVESTMENT_CHF, investorFeeChf } from './fees';
