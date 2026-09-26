/**
 * Typen für Projekte und Dokumente, Struktur nach Spec, Abschnitt 6.
 * Datenzugriff in ./index.ts (Supabase), Beispieldaten in ./example-data.ts.
 */

export type Locale = 'de' | 'en';
export type Localized = Record<Locale, string>;

export const ASSET_TYPES = ['company', 'real_estate', 'energy', 'collectible'] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

/** Statuswerte gemäss Spec, Abschnitt 6. Öffentlich sichtbar sind nur active, funded, failed, cancelled, closed. */
export type ProjectStatus =
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'active'
  | 'funded'
  | 'failed'
  | 'cancelled'
  | 'closed';

/** Anzeige-Status im Marktplatz (Spec, Abschnitt 3): offen, finanziert, geschlossen. */
export const PUBLIC_STATUSES = ['open', 'funded', 'closed'] as const;
export type PublicStatus = (typeof PUBLIC_STATUSES)[number];

export type TokenModel = 'erc20' | 'erc721' | 'erc1155';

/** Absicherung (Spec, Abschnitt 11a). LIQUODA bewertet sie nicht. */
export const COLLATERAL_TYPES = ['none', 'pledge', 'guarantee', 'milestone_payout'] as const;
export type CollateralType = (typeof COLLATERAL_TYPES)[number];

export type DocumentType = 'contract' | 'prospectus' | 'valuation' | 'financials' | 'other';

export interface ProjectDocument {
  id: string;
  type: DocumentType;
  title: Localized;
  version: number;
  date: string; // ISO-Datum
}

export interface Project {
  id: string;
  slug: string;
  title: Localized;
  issuerName: string;
  location: Localized;
  assetType: AssetType;
  summary: Localized;
  description: Localized[]; // Absätze
  purpose: Localized;
  targetAmountChf: number;
  raisedAmountChf: number;
  minInvestmentChf: number;
  deadline: string; // ISO-Datum
  status: ProjectStatus;
  tokenModel: TokenModel;
  collateralType: CollateralType;
  collateralNote: string | null;
  documents: ProjectDocument[];
  risks: Localized[]; // projektspezifische Risiken, ergänzend zu den allgemeinen Hinweisen
}

export function publicStatus(project: Project): PublicStatus | null {
  switch (project.status) {
    case 'active':
      return 'open';
    case 'funded':
      return 'funded';
    case 'failed':
    case 'cancelled':
    case 'closed':
      return 'closed';
    default:
      return null; // draft, in_review, approved: nicht öffentlich
  }
}

export function progressPercent(project: Project): number {
  if (project.targetAmountChf <= 0) return 0;
  return Math.min(100, Math.round((project.raisedAmountChf / project.targetAmountChf) * 100));
}

export function isAssetType(value: unknown): value is AssetType {
  return typeof value === 'string' && (ASSET_TYPES as readonly string[]).includes(value);
}

export function isPublicStatus(value: unknown): value is PublicStatus {
  return typeof value === 'string' && (PUBLIC_STATUSES as readonly string[]).includes(value);
}
