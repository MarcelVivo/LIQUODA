/**
 * Projektdaten für den Marktplatz (Etappe 2).
 * Struktur nach Spec, Abschnitt 6 («projects», «documents»).
 * In Etappe 3 wird diese Datei durch Supabase ersetzt; die Typen bleiben.
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

/** Alle öffentlich sichtbaren Projekte, optional gefiltert. */
export function getProjects(filter: { assetType?: AssetType; status?: PublicStatus } = {}): Project[] {
  return projects.filter((p) => {
    const status = publicStatus(p);
    if (!status) return false;
    if (filter.assetType && p.assetType !== filter.assetType) return false;
    if (filter.status && status !== filter.status) return false;
    return true;
  });
}

export function getProjectBySlug(slug: string): Project | undefined {
  const project = projects.find((p) => p.slug === slug);
  return project && publicStatus(project) ? project : undefined;
}

/** Die drei Projekte für die Vorschau auf der Startseite. */
export function getFeaturedProjects(): Project[] {
  return ['pizzeria-wander-bern', 'mehrfamilienhaus-vera-thun', 'display-solutions-ag']
    .map((slug) => projects.find((p) => p.slug === slug))
    .filter((p): p is Project => !!p);
}

const projects: Project[] = [
  {
    id: 'p-001',
    slug: 'pizzeria-wander-bern',
    title: { de: 'Pizzeria Wander, Bern', en: 'Pizzeria Wander, Bern' },
    issuerName: 'Wander Gastro GmbH',
    location: { de: 'Bern BE', en: 'Bern BE' },
    assetType: 'company',
    summary: {
      de: 'Familienbetrieb in der Berner Länggasse. Das Kapital dient dem Ausbau der Terrasse und dem Ersatz der Küchenausstattung.',
      en: 'Family-run restaurant in Bern’s Länggasse district. The capital funds the terrace extension and replacement of kitchen equipment.',
    },
    description: [
      {
        de: 'Die Pizzeria Wander besteht seit 2011 und wird in zweiter Generation geführt. Der Betrieb hat 42 Sitzplätze innen und 24 auf der bestehenden Terrasse. Die Auslastung liegt im Sommer regelmässig an der Kapazitätsgrenze.',
        en: 'Pizzeria Wander has existed since 2011 and is run by the second generation. The restaurant has 42 seats inside and 24 on the existing terrace. In summer, occupancy regularly reaches capacity.',
      },
      {
        de: 'Geplant sind eine Erweiterung der Terrasse um 20 Plätze sowie der Ersatz von Pizzaofen und Kühlanlage. Die Investoren erhalten fungible Anteile am Projektvehikel. Die Rückführung des Kapitals ist über eine Laufzeit von fünf Jahren aus dem laufenden Betrieb vorgesehen.',
        en: 'The plan is to extend the terrace by 20 seats and replace the pizza oven and refrigeration. Investors receive fungible shares in the project vehicle. Repayment of the capital is planned over a term of five years from ongoing operations.',
      },
    ],
    purpose: {
      de: 'Terrassenerweiterung, neuer Pizzaofen, neue Kühlanlage.',
      en: 'Terrace extension, new pizza oven, new refrigeration.',
    },
    targetAmountChf: 30000,
    raisedAmountChf: 20100,
    minInvestmentChf: 1000,
    deadline: '2026-12-31',
    status: 'active',
    tokenModel: 'erc20',
    documents: [
      { id: 'd-001-1', type: 'prospectus', title: { de: 'Projektbeschrieb', en: 'Project description' }, version: 2, date: '2026-09-01' },
      { id: 'd-001-2', type: 'financials', title: { de: 'Jahresrechnung 2025', en: 'Annual accounts 2025' }, version: 1, date: '2026-04-12' },
      { id: 'd-001-3', type: 'contract', title: { de: 'Beteiligungsvertrag (Muster)', en: 'Participation agreement (template)' }, version: 1, date: '2026-08-20' },
    ],
    risks: [
      {
        de: 'Der Betrieb ist von der Saison und vom Wetter abhängig. Ein schlechter Sommer verringert den Umsatz der Terrasse.',
        en: 'The business depends on the season and the weather. A poor summer reduces terrace revenue.',
      },
      {
        de: 'Die Rückführung des Kapitals hängt vom laufenden Geschäftsgang ab. Bei einer Betriebsaufgabe kann das Kapital ganz oder teilweise verloren gehen.',
        en: 'Repayment depends on ongoing business performance. If the business closes, the capital may be lost in full or in part.',
      },
    ],
  },
  {
    id: 'p-002',
    slug: 'mehrfamilienhaus-vera-thun',
    title: { de: 'Mehrfamilienhaus Vera, Thun', en: 'Apartment building Vera, Thun' },
    issuerName: 'Vera Immobilien AG',
    location: { de: 'Thun BE', en: 'Thun BE' },
    assetType: 'real_estate',
    summary: {
      de: 'Energetische Sanierung eines Mehrfamilienhauses mit acht Wohnungen: Dach, Fassade und Heizungsersatz.',
      en: 'Energy renovation of an apartment building with eight flats: roof, façade and heating replacement.',
    },
    description: [
      {
        de: 'Das Gebäude aus dem Jahr 1972 ist vollständig vermietet. Die Eigentümerin plant den Ersatz der Ölheizung durch eine Wärmepumpe, die Dämmung von Dach und Fassade sowie eine Photovoltaikanlage auf dem Dach.',
        en: 'The building dates from 1972 and is fully let. The owner plans to replace the oil heating with a heat pump, insulate the roof and façade and install a photovoltaic system on the roof.',
      },
      {
        de: 'Die Finanzierung ergänzt ein Bankdarlehen. Investoren erhalten fungible Anteile am Sanierungsvehikel mit einer Laufzeit von acht Jahren. Die Rückführung ist aus den Mieterträgen vorgesehen.',
        en: 'The financing complements a bank loan. Investors receive fungible shares in the renovation vehicle with a term of eight years. Repayment is planned from rental income.',
      },
    ],
    purpose: {
      de: 'Wärmepumpe, Dämmung Dach und Fassade, Photovoltaikanlage.',
      en: 'Heat pump, roof and façade insulation, photovoltaic system.',
    },
    targetAmountChf: 600000,
    raisedAmountChf: 138000,
    minInvestmentChf: 1000,
    deadline: '2027-03-31',
    status: 'active',
    tokenModel: 'erc20',
    documents: [
      { id: 'd-002-1', type: 'prospectus', title: { de: 'Sanierungskonzept', en: 'Renovation concept' }, version: 1, date: '2026-07-15' },
      { id: 'd-002-2', type: 'valuation', title: { de: 'Verkehrswertschätzung', en: 'Market value appraisal' }, version: 1, date: '2026-06-02' },
      { id: 'd-002-3', type: 'financials', title: { de: 'Mietertragsaufstellung', en: 'Rental income statement' }, version: 1, date: '2026-07-15' },
      { id: 'd-002-4', type: 'contract', title: { de: 'Beteiligungsvertrag (Muster)', en: 'Participation agreement (template)' }, version: 1, date: '2026-08-01' },
    ],
    risks: [
      {
        de: 'Bauprojekte können teurer werden oder länger dauern als geplant.',
        en: 'Construction projects can become more expensive or take longer than planned.',
      },
      {
        de: 'Leerstände oder sinkende Mieten verringern die Mittel für die Rückführung.',
        en: 'Vacancies or falling rents reduce the funds available for repayment.',
      },
      {
        de: 'Die Beteiligung ist über acht Jahre gebunden. Es gibt keinen Sekundärmarkt.',
        en: 'The participation is locked for eight years. There is no secondary market.',
      },
    ],
  },
  {
    id: 'p-003',
    slug: 'display-solutions-ag',
    title: { de: 'Display Solutions AG', en: 'Display Solutions AG' },
    issuerName: 'Display Solutions AG',
    location: { de: 'Winterthur ZH', en: 'Winterthur ZH' },
    assetType: 'company',
    summary: {
      de: 'Junges Unternehmen für digitale Beschriftungssysteme im Detailhandel. Das Kapital finanziert die erste Serienproduktion.',
      en: 'Young company for digital signage systems in retail. The capital funds the first series production.',
    },
    description: [
      {
        de: 'Display Solutions entwickelt elektronische Preisschilder und Regaldisplays für kleine und mittlere Detailhändler. Ein Pilotprojekt mit drei Filialen läuft seit Anfang 2026.',
        en: 'Display Solutions develops electronic price tags and shelf displays for small and medium-sized retailers. A pilot with three stores has been running since early 2026.',
      },
      {
        de: 'Mit dem Kapital wird eine erste Serie von 2000 Einheiten produziert. Investoren erhalten fungible Anteile mit einer Laufzeit von vier Jahren. Das Unternehmen ist in einer frühen Phase; der Geschäftsverlauf ist noch nicht erprobt.',
        en: 'The capital funds a first series of 2,000 units. Investors receive fungible shares with a term of four years. The company is at an early stage; its business performance is not yet proven.',
      },
    ],
    purpose: {
      de: 'Erste Serienproduktion von 2000 Einheiten, Zertifizierung.',
      en: 'First series production of 2,000 units, certification.',
    },
    targetAmountChf: 100000,
    raisedAmountChf: 45000,
    minInvestmentChf: 1000,
    deadline: '2027-01-31',
    status: 'active',
    tokenModel: 'erc20',
    documents: [
      { id: 'd-003-1', type: 'prospectus', title: { de: 'Businessplan (Kurzfassung)', en: 'Business plan (summary)' }, version: 3, date: '2026-08-28' },
      { id: 'd-003-2', type: 'financials', title: { de: 'Finanzplan 2026 bis 2029', en: 'Financial plan 2026 to 2029' }, version: 2, date: '2026-08-28' },
      { id: 'd-003-3', type: 'contract', title: { de: 'Beteiligungsvertrag (Muster)', en: 'Participation agreement (template)' }, version: 1, date: '2026-09-05' },
    ],
    risks: [
      {
        de: 'Frühphasenunternehmen scheitern häufig. Ein Totalverlust ist möglich.',
        en: 'Early-stage companies frequently fail. A total loss is possible.',
      },
      {
        de: 'Der Finanzplan beruht auf Annahmen zu Absatz und Preisen, die noch nicht bestätigt sind.',
        en: 'The financial plan is based on assumptions about sales and prices that are not yet confirmed.',
      },
    ],
  },
  {
    id: 'p-004',
    slug: 'solaranlage-gewerbedach-burgdorf',
    title: { de: 'Solaranlage Gewerbedach, Burgdorf', en: 'Solar plant on commercial roof, Burgdorf' },
    issuerName: 'Emme Solar GmbH',
    location: { de: 'Burgdorf BE', en: 'Burgdorf BE' },
    assetType: 'energy',
    summary: {
      de: 'Photovoltaikanlage mit 280 kWp auf dem Dach einer Logistikhalle. Der Strom wird an den Hallenbetreiber und ins Netz verkauft.',
      en: 'Photovoltaic plant with 280 kWp on the roof of a logistics hall. Electricity is sold to the hall operator and to the grid.',
    },
    description: [
      {
        de: 'Die Anlage wurde im Sommer 2026 in Betrieb genommen. Mit dem Betreiber der Halle besteht ein Abnahmevertrag über 15 Jahre für rund 60 Prozent der Produktion. Der Rest wird ins Netz eingespeist.',
        en: 'The plant was commissioned in summer 2026. A 15-year purchase agreement with the hall operator covers around 60 percent of production. The remainder is fed into the grid.',
      },
      {
        de: 'Die Finanzierungsrunde ist abgeschlossen. Investoren halten fungible Anteile mit einer Laufzeit von zwölf Jahren. Die Rückführung erfolgt aus den Stromerlösen.',
        en: 'The funding round is complete. Investors hold fungible shares with a term of twelve years. Repayment comes from electricity revenues.',
      },
    ],
    purpose: {
      de: 'Bau und Inbetriebnahme der Photovoltaikanlage.',
      en: 'Construction and commissioning of the photovoltaic plant.',
    },
    targetAmountChf: 250000,
    raisedAmountChf: 250000,
    minInvestmentChf: 1000,
    deadline: '2026-06-30',
    status: 'funded',
    tokenModel: 'erc20',
    documents: [
      { id: 'd-004-1', type: 'prospectus', title: { de: 'Anlagebeschrieb und Ertragsprognose des Installateurs', en: 'Plant description and yield estimate by the installer' }, version: 1, date: '2026-02-10' },
      { id: 'd-004-2', type: 'contract', title: { de: 'Stromabnahmevertrag (Auszug)', en: 'Power purchase agreement (excerpt)' }, version: 1, date: '2026-03-01' },
      { id: 'd-004-3', type: 'contract', title: { de: 'Beteiligungsvertrag', en: 'Participation agreement' }, version: 2, date: '2026-06-30' },
    ],
    risks: [
      {
        de: 'Die Stromerlöse hängen von Sonneneinstrahlung und Marktpreisen ab. Beides schwankt.',
        en: 'Electricity revenues depend on solar irradiation and market prices. Both fluctuate.',
      },
      {
        de: 'Fällt der Hallenbetreiber als Abnehmer aus, sinken die Erlöse.',
        en: 'If the hall operator ceases to purchase, revenues fall.',
      },
    ],
  },
  {
    id: 'p-005',
    slug: 'porsche-356-coupe-1958',
    title: { de: 'Porsche 356 A Coupé, Jahrgang 1958', en: 'Porsche 356 A Coupé, 1958' },
    issuerName: 'Classic Garage Aarau AG',
    location: { de: 'Aarau AG', en: 'Aarau AG' },
    assetType: 'collectible',
    summary: {
      de: 'Einzelnes Sammlerfahrzeug mit dokumentierter Historie. Der Eigentümer setzt einen Teil des Werts frei, ohne das Fahrzeug zu verkaufen.',
      en: 'Single collector car with documented history. The owner releases part of the value without selling the vehicle.',
    },
    description: [
      {
        de: 'Das Fahrzeug befindet sich seit 2014 im Besitz der Emittentin und wurde 2019 restauriert. Es ist versichert und in einer klimatisierten Halle eingelagert. Ein unabhängiges Gutachten liegt vor.',
        en: 'The vehicle has been owned by the issuer since 2014 and was restored in 2019. It is insured and stored in a climate-controlled hall. An independent appraisal is available.',
      },
      {
        de: 'Die Beteiligung ist als einzelner Token (ERC-721) abgebildet, der die Beteiligung am Fahrzeug als Ganzes repräsentiert. Die Runde ist abgeschlossen. Die Laufzeit beträgt sechs Jahre; danach ist ein Rückkauf durch die Emittentin oder ein Verkauf des Fahrzeugs vorgesehen.',
        en: 'The participation is represented by a single token (ERC-721) that represents the participation in the vehicle as a whole. The round is complete. The term is six years; after that, a buy-back by the issuer or a sale of the vehicle is planned.',
      },
    ],
    purpose: {
      de: 'Freisetzung von Kapital für die Restaurierung weiterer Fahrzeuge.',
      en: 'Releasing capital for the restoration of further vehicles.',
    },
    targetAmountChf: 85000,
    raisedAmountChf: 85000,
    minInvestmentChf: 5000,
    deadline: '2026-08-15',
    status: 'funded',
    tokenModel: 'erc721',
    documents: [
      { id: 'd-005-1', type: 'valuation', title: { de: 'Fahrzeuggutachten', en: 'Vehicle appraisal' }, version: 1, date: '2026-04-22' },
      { id: 'd-005-2', type: 'other', title: { de: 'Versicherungsnachweis', en: 'Proof of insurance' }, version: 1, date: '2026-05-03' },
      { id: 'd-005-3', type: 'contract', title: { de: 'Beteiligungsvertrag', en: 'Participation agreement' }, version: 1, date: '2026-08-15' },
    ],
    risks: [
      {
        de: 'Der Wert von Sammlerfahrzeugen schwankt und kann sinken. Ein Verkauf kann Zeit brauchen.',
        en: 'The value of collector cars fluctuates and can fall. A sale can take time.',
      },
      {
        de: 'Schäden oder Diebstahl sind versichert, doch Versicherungsleistungen können unter dem Gutachtenwert liegen.',
        en: 'Damage or theft is insured, but insurance payouts can be below the appraised value.',
      },
    ],
  },
  {
    id: 'p-006',
    slug: 'schreinerei-huber-maschinenpark',
    title: { de: 'Schreinerei Huber, Maschinenpark', en: 'Huber joinery, machinery' },
    issuerName: 'Schreinerei Huber AG',
    location: { de: 'Sursee LU', en: 'Sursee LU' },
    assetType: 'company',
    summary: {
      de: 'Ersatz von zwei CNC-Maschinen. Das Finanzierungsziel wurde innerhalb der Laufzeit nicht erreicht; die Runde wurde rückabgewickelt.',
      en: 'Replacement of two CNC machines. The funding target was not reached within the term; the round was reversed.',
    },
    description: [
      {
        de: 'Die Schreinerei Huber beschäftigt 14 Mitarbeitende und plante den Ersatz von zwei CNC-Bearbeitungszentren. Die Finanzierungsrunde lief von Februar bis Mai 2026.',
        en: 'Huber joinery employs 14 people and planned to replace two CNC machining centres. The funding round ran from February to May 2026.',
      },
      {
        de: 'Bis zum Ende der Laufzeit wurden 34 Prozent des Zielbetrags erreicht. Gemäss Ablauf wurden keine Token ausgegeben. Alle Zahlungen wurden an die Investoren zurückerstattet.',
        en: 'By the end of the term, 34 percent of the target amount was reached. As per the process, no tokens were issued. All payments were refunded to investors.',
      },
    ],
    purpose: {
      de: 'Ersatz von zwei CNC-Bearbeitungszentren.',
      en: 'Replacement of two CNC machining centres.',
    },
    targetAmountChf: 120000,
    raisedAmountChf: 41000,
    minInvestmentChf: 1000,
    deadline: '2026-05-31',
    status: 'failed',
    tokenModel: 'erc20',
    documents: [
      { id: 'd-006-1', type: 'prospectus', title: { de: 'Projektbeschrieb', en: 'Project description' }, version: 1, date: '2026-01-20' },
      { id: 'd-006-2', type: 'financials', title: { de: 'Jahresrechnung 2025', en: 'Annual accounts 2025' }, version: 1, date: '2026-03-30' },
    ],
    risks: [
      {
        de: 'Investitionen in Produktionsmittel zahlen sich nur aus, wenn die Auftragslage stabil bleibt.',
        en: 'Investments in production equipment only pay off if the order situation remains stable.',
      },
    ],
  },
];
