import type { AssetType, DocumentType } from '@/lib/projects/types';

/** Alle Dokumentarten (Reihenfolge = Anzeige). */
export const ALL_DOCUMENT_TYPES: DocumentType[] = [
  'business_plan', 'financing_concept', 'prospectus', 'financials', 'commercial_register',
  'land_register', 'valuation', 'ownership_proof', 'insurance', 'yield_report', 'purchase_agreement',
  'contract', 'other',
];

/** Pflichtdokumente je Asset-Art (Spec: Vertrauen vor Geschwindigkeit). Ohne sie kann nicht eingereicht werden. */
export const REQUIRED_DOCUMENTS: Record<AssetType, DocumentType[]> = {
  company: ['business_plan', 'financials', 'commercial_register'],
  real_estate: ['land_register', 'valuation', 'financing_concept'],
  energy: ['prospectus', 'yield_report', 'purchase_agreement'],
  collectible: ['ownership_proof', 'valuation', 'insurance'],
};

export function missingDocumentTypes(assetType: AssetType, present: DocumentType[]): DocumentType[] {
  return REQUIRED_DOCUMENTS[assetType].filter((t) => !present.includes(t));
}
