import type Anthropic from '@anthropic-ai/sdk';
import { getSupabaseAdmin } from '@/lib/supabase';
import { DOCUMENT_BUCKET, type DocumentRecord } from '@/lib/documents';
import { missingDocumentTypes, REQUIRED_DOCUMENTS } from '@/lib/document-requirements';
import { submissionProblems, type OwnProject } from '@/lib/emittent';
import { getAnthropic, KI_BETAS, KI_MODEL } from './client';
import { LIQUODA_WISSEN } from './wissen';

/**
 * Vorprüfung durch die KI: liest Projektangaben und alle hochgeladenen
 * Dokumente, prüft Vollständigkeit, Konsistenz, Tonalität und Plausibilität
 * und schreibt einen strukturierten Bericht für Kapitalnehmer und Admin.
 * Die Freigabe bleibt manuell bei LIQUODA (Spec, Abschnitt 12).
 */

export type PrecheckStatus = 'ok' | 'warning' | 'problem';
export interface PrecheckResult {
  verdict: 'ready' | 'needs_work' | 'not_suitable';
  score: number;
  summary: string;
  adminSummary: string;
  checks: { area: string; status: PrecheckStatus; note: string }[];
  documents: { title: string; status: PrecheckStatus; note: string }[];
  openPoints: string[];
}

export interface PrecheckRecord {
  id: string;
  project_id: string;
  verdict: PrecheckResult['verdict'];
  score: number;
  result: PrecheckResult;
  model: string | null;
  created_at: string;
}

const RESULT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['verdict', 'score', 'summary', 'adminSummary', 'checks', 'documents', 'openPoints'],
  properties: {
    verdict: { type: 'string', enum: ['ready', 'needs_work', 'not_suitable'] },
    score: { type: 'integer', minimum: 0, maximum: 100 },
    summary: { type: 'string' },
    adminSummary: { type: 'string' },
    checks: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['area', 'status', 'note'],
        properties: { area: { type: 'string' }, status: { type: 'string', enum: ['ok', 'warning', 'problem'] }, note: { type: 'string' } },
      },
    },
    documents: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'status', 'note'],
        properties: { title: { type: 'string' }, status: { type: 'string', enum: ['ok', 'warning', 'problem'] }, note: { type: 'string' } },
      },
    },
    openPoints: { type: 'array', items: { type: 'string' } },
  },
} as const;

const MAX_DOC_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_BYTES = 24 * 1024 * 1024;

const DOC_LABEL: Record<string, string> = {
  business_plan: 'Businessplan', financing_concept: 'Finanzierungskonzept', prospectus: 'Projektbeschrieb', financials: 'Jahresrechnung / Finanzen',
  commercial_register: 'Handelsregisterauszug', land_register: 'Grundbuchauszug', valuation: 'Gutachten / Bewertung', ownership_proof: 'Eigentumsnachweis',
  insurance: 'Versicherungsnachweis', yield_report: 'Ertragsgutachten', purchase_agreement: 'Abnahmevertrag', contract: 'Vertrag', other: 'Sonstiges',
};
const ASSET_LABEL: Record<string, string> = { company: 'Unternehmen', real_estate: 'Immobilie', energy: 'Energie', collectible: 'Sachwert' };

export function projectFacts(project: OwnProject, documents: DocumentRecord[]): string {
  const missing = missingDocumentTypes(project.asset_type, documents.map((d) => d.type));
  const problems = submissionProblems(project, documents);
  return [
    `Titel: ${project.title.de || '(leer)'} / EN: ${project.title.en || '(leer)'}`,
    `Status: ${project.status}`,
    `Asset-Art: ${ASSET_LABEL[project.asset_type] ?? project.asset_type} · Art der Anteile: ${project.token_model}`,
    `Ort: ${project.location.de || '(leer)'}`,
    `Kurzbeschreibung: ${project.summary.de || '(leer)'}`,
    `Beschreibung (${project.description?.de?.length ?? 0} Absätze):\n${(project.description?.de ?? []).join('\n\n') || '(leer)'}`,
    `Verwendung des Kapitals: ${project.purpose.de || '(leer)'}`,
    `Projektspezifische Risiken:\n${(project.risks?.de ?? []).map((r) => `- ${r}`).join('\n') || '(leer)'}`,
    `Zielbetrag: CHF ${Number(project.target_amount_chf)} · Mindestbetrag je Beteiligung: CHF ${Number(project.min_investment_chf)} · Laufzeit bis: ${project.deadline}`,
    `Absicherung: ${project.collateral_type}${project.collateral_note ? ` – ${project.collateral_note}` : ''}`,
    `Titelbild: ${project.cover_image_path ? 'vorhanden' : 'fehlt'} · Galerie: ${project.gallery_paths?.length ?? 0} Bilder`,
    `Dokumente (${documents.length}): ${documents.map((d) => `${d.title.de} [${DOC_LABEL[d.type] ?? d.type}, ${d.visibility === 'public' ? 'öffentlich' : 'nur angemeldet'}]`).join('; ') || 'keine'}`,
    `Pflichtdokumente für ${ASSET_LABEL[project.asset_type]}: ${REQUIRED_DOCUMENTS[project.asset_type].map((t) => DOC_LABEL[t]).join(', ')} · fehlend: ${missing.map((t) => DOC_LABEL[t]).join(', ') || 'keine'}`,
    `Formale Vollständigkeit (Plattform-Check): ${problems.length ? `offen: ${problems.join(', ')}` : 'vollständig'}`,
    `KI-Assistent freigeschaltet: ${project.ai_unlocked_at ? 'ja' : 'nein'}`,
  ].join('\n');
}

async function loadDocumentBlocks(documents: DocumentRecord[]): Promise<{ blocks: Anthropic.Beta.BetaContentBlockParam[]; notes: string[] }> {
  const admin = getSupabaseAdmin();
  const blocks: Anthropic.Beta.BetaContentBlockParam[] = [];
  const notes: string[] = [];
  let total = 0;
  for (const doc of documents) {
    if (!doc.storage_path) continue;
    const { data, error } = await admin.storage.from(DOCUMENT_BUCKET).download(doc.storage_path);
    if (error || !data) {
      notes.push(`«${doc.title.de}» konnte nicht geladen werden.`);
      continue;
    }
    if (data.size > MAX_DOC_BYTES || total + data.size > MAX_TOTAL_BYTES) {
      notes.push(`«${doc.title.de}» ist zu gross für die automatische Prüfung (${Math.round(data.size / 1024 / 1024)} MB) und muss manuell gesichtet werden.`);
      continue;
    }
    total += data.size;
    const base64 = Buffer.from(await data.arrayBuffer()).toString('base64');
    const label = `${doc.title.de} (${DOC_LABEL[doc.type] ?? doc.type}, Version ${doc.version})`;
    if (data.type === 'application/pdf' || doc.storage_path.endsWith('.pdf')) {
      blocks.push({ type: 'text', text: `Dokument: ${label}` });
      blocks.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 }, title: label });
    } else {
      const media = doc.storage_path.endsWith('.png') ? 'image/png' : 'image/jpeg';
      blocks.push({ type: 'text', text: `Dokument (Bild): ${label}` });
      blocks.push({ type: 'image', source: { type: 'base64', media_type: media, data: base64 } });
    }
  }
  return { blocks, notes };
}

const PRECHECK_SYSTEM = `Du bist die Vorprüfung der Plattform LIQUODA. Du prüfst ein Projekt eines Kapitalnehmers, bevor es LIQUODA zur manuellen Freigabe vorgelegt wird. Du entscheidest nichts; du bereitest die Entscheidung vor.

Prüfe sachlich und streng, aber fair:
1. Vollständigkeit: alle Angaben, Titelbild, Pflichtdokumente je Asset-Art (siehe Wissensbasis).
2. Konsistenz: Zielbetrag vs. Verwendung des Kapitals; Mindestbetrag; Laufzeit realistisch; Ort; Angaben in Texten und Dokumenten stimmen überein (Namen, Firma, Adresse, Beträge, Daten, Eigentümer).
3. Dokumente: passt jedes Dokument zur deklarierten Art? Ist es lesbar, aktuell, vollständig, unterschrieben, wo nötig? Nenne konkrete Auffälligkeiten (fehlende Seiten, andere Firma, abgelaufen, Widersprüche).
4. Tonalität und Regeln: keine Rendite- oder Gewinnversprechen, keine Garantieaussagen, keine Dringlichkeit, keine irreführenden Aussagen, keine Begriffe wie «versichert» oder «geschützt» im Sinne einer Plattformgarantie. Sachlich, verständlich, beide Sprachen vorhanden.
5. Risiken: sind die projektspezifischen Risiken ehrlich und vollständig? Was fehlt offensichtlich?
6. Absicherung: passt die Beschreibung der Sicherheit zur gewählten Art und zu den Dokumenten?
7. Eignung: passt das Vorhaben grundsätzlich zu LIQUODA (reale Vermögenswerte, Schweiz, konkretes Vorhaben)? Hinweise auf Spekulation, Kryptohandel, Schneeballstrukturen oder fehlende Berechtigung sind «not_suitable».

Urteil: «ready», wenn keine Probleme und höchstens kleine Hinweise offen sind. «needs_work», wenn etwas fehlt oder widersprüchlich ist. «not_suitable», wenn das Vorhaben grundsätzlich nicht passt oder Täuschung naheliegt. Score 0 bis 100 als Gesamteindruck der Einreichungsreife.

Sprache: «summary», «checks», «documents» und «openPoints» in der Sprache des Kapitalnehmers ({LOCALE}); «adminSummary» immer auf Deutsch (Schweizer Schreibweise, «ss» statt «ß»), als Empfehlung an LIQUODA: was der Bericht ergab, was LIQUODA vor der Freigabe manuell verifizieren sollte (z. B. Handelsregister online abgleichen, Eigentümer telefonisch bestätigen). «openPoints» sind konkrete, umsetzbare Aufgaben für den Kapitalnehmer, in Reihenfolge der Wichtigkeit, ohne Wiederholungen. Erfinde keine Fakten; wenn ein Dokument nicht lesbar ist, sag das.`;

/** Vorprüfung ausführen und speichern. */
export async function runPrecheck(params: { project: OwnProject; documents: DocumentRecord[]; locale: 'de' | 'en' }): Promise<PrecheckRecord> {
  const client = getAnthropic();
  const { blocks, notes } = await loadDocumentBlocks(params.documents);

  const content: Anthropic.Beta.BetaContentBlockParam[] = [
    { type: 'text', text: `Projektangaben:\n${projectFacts(params.project, params.documents)}${notes.length ? `\n\nHinweise zum Laden der Dokumente:\n${notes.map((n) => `- ${n}`).join('\n')}` : ''}` },
    ...blocks,
    { type: 'text', text: 'Erstelle jetzt den Vorprüfungsbericht im vorgegebenen JSON-Format.' },
  ];

  const stream = client.beta.messages.stream({
    model: KI_MODEL,
    max_tokens: 16000,
    betas: KI_BETAS,
    fallbacks: 'default',
    thinking: { type: 'adaptive' },
    output_config: { effort: 'high', format: { type: 'json_schema', schema: RESULT_SCHEMA as unknown as Record<string, unknown> } },
    system: [
      { type: 'text', text: LIQUODA_WISSEN, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: PRECHECK_SYSTEM.replace('{LOCALE}', params.locale === 'en' ? 'Englisch' : 'Deutsch') },
    ],
    messages: [{ role: 'user', content }],
  });
  const message = await stream.finalMessage();
  if (message.stop_reason === 'refusal') throw new Error('precheck_refused');
  const text = message.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text').map((b) => b.text).join('');
  const result = JSON.parse(text) as PrecheckResult;

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('ai_prechecks')
    .insert({ project_id: params.project.id, verdict: result.verdict, score: result.score, result, model: message.model })
    .select('*')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'precheck_save');
  return data as PrecheckRecord;
}

export async function latestPrecheck(projectId: string): Promise<PrecheckRecord | null> {
  const { data } = await getSupabaseAdmin()
    .from('ai_prechecks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as PrecheckRecord | null) ?? null;
}
