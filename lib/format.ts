/** Beträge in CHF nach Schweizer Schreibweise, z. B. «CHF 1'500». */
export function formatChf(amount: number): string {
  const grouped = new Intl.NumberFormat('de-CH', { maximumFractionDigits: 0 }).format(amount);
  // Intl liefert das typografische Apostroph (’); die Spec nutzt das gerade (').
  return `CHF ${grouped.replace(/’/g, "'")}`;
}

/** Datum als «15.12.2026» (DE) bzw. «15 Dec 2026» (EN). */
export function formatDate(iso: string, locale: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'de-CH', {
    day: '2-digit',
    month: locale === 'en' ? 'short' : '2-digit',
    year: 'numeric',
  }).format(date);
}

/** Ganze Tage von heute bis zum Datum; negativ, wenn vorbei. */
export function daysUntil(iso: string, now = new Date()): number {
  const target = new Date(`${iso}T00:00:00`);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - start.getTime()) / 86_400_000);
}
