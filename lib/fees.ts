/** Gebühren und Grenzen (Spec, Abschnitt 1 und 10). Ohne Server-Abhängigkeiten, auch im Browser nutzbar. */
export const INVESTOR_FEE_RATE = 0.01; // 1 %, transparent ausgewiesen
export const MAX_INVESTMENT_CHF = 20000;

export function investorFeeChf(amountChf: number): number {
  return Math.round(amountChf * INVESTOR_FEE_RATE * 100) / 100;
}
