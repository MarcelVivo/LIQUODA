export const STATUS_LABEL: Record<string, string> = {
  draft: 'Entwurf',
  in_review: 'In Prüfung',
  approved: 'Freigegeben',
  active: 'Offen',
  funded: 'Finanziert',
  failed: 'Nicht erfolgreich',
  cancelled: 'Beendet',
  closed: 'Geschlossen',
};

export const KYC_LABEL: Record<string, string> = {
  pending: 'Ausstehend',
  approved: 'Bestätigt',
  rejected: 'Nicht bestanden',
};

export const th = 'text-left px-6 py-4 text-[10px] font-semibold tracking-[0.25em] uppercase text-gray-400';
export const td = 'px-6 py-4 text-gray-800';
export const card = 'bg-white rounded-xl border border-gray-100 shadow-sm';

export function chf(n: number | string): string {
  return `CHF ${new Intl.NumberFormat('de-CH', { maximumFractionDigits: 0 }).format(Number(n)).replace(/’/g, "'")}`;
}

export function dt(iso: string): string {
  return new Date(iso).toLocaleString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
