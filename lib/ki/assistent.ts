import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase';
import { storeDocument, type DocumentRecord } from '@/lib/documents';
import type { OwnProject } from '@/lib/emittent';
import { submitProject, validateProjectUpdate } from '@/lib/emittent-actions';
import type { DocumentType } from '@/lib/projects/types';
import { getAnthropic, KI_BETAS, KI_MODEL } from './client';
import { markdownToPdf } from './pdf';
import { latestPrecheck, projectFacts, runPrecheck } from './vorpruefung';
import { LIQUODA_WISSEN } from './wissen';

/**
 * KI-Assistent für Kapitalnehmer (Etappe 20). Ein Gesprächsverlauf je Projekt.
 * Der Assistent füllt Projektfelder, schreibt Dokumente (PDF), führt die
 * Vorprüfung aus und reicht das Projekt nach ausdrücklicher Bestätigung ein.
 * Alles läuft im Backend mit Service-Rolle; die Eigentümerschaft prüft der Route Handler.
 */

export type ToolName = 'projekt_aktualisieren' | 'dokument_erstellen' | 'vorpruefung_starten' | 'einreichen';
export const TOOL_NAMES: ToolName[] = ['projekt_aktualisieren', 'dokument_erstellen', 'vorpruefung_starten', 'einreichen'];

export type KiEvent =
  | { type: 'text'; text: string }
  | { type: 'tool'; name: ToolName; status: 'start' | 'ok' | 'error' }
  | { type: 'done'; changed: boolean }
  | { type: 'error'; code: 'server' | 'rate' | 'auth' | 'refusal' | 'truncated' };

export interface KiDisplayMessage {
  role: 'user' | 'assistant';
  text: string;
  tools: { name: ToolName; ok: boolean }[];
}

type MessageParam = Anthropic.Beta.BetaMessageParam;
const STATE_TAG = '<projektstand>';

// ---------------------------------------------------------------------------
// Verlauf laden, speichern, anzeigen
// ---------------------------------------------------------------------------

export async function loadConversation(projectId: string): Promise<MessageParam[]> {
  const { data } = await getSupabaseAdmin().from('ai_conversations').select('messages').eq('project_id', projectId).maybeSingle();
  return ((data?.messages as MessageParam[] | undefined) ?? []);
}

async function saveConversation(projectId: string, messages: MessageParam[], turnsDelta: number): Promise<void> {
  const admin = getSupabaseAdmin();
  const { data } = await admin.from('ai_conversations').select('turns').eq('project_id', projectId).maybeSingle();
  await admin
    .from('ai_conversations')
    .upsert({ project_id: projectId, messages, turns: (data?.turns ?? 0) + turnsDelta, updated_at: new Date().toISOString() });
}

export async function resetConversation(projectId: string): Promise<void> {
  await getSupabaseAdmin().from('ai_conversations').delete().eq('project_id', projectId);
}

/** Verlauf für die Oberfläche: Projektstand-Blöcke und Werkzeug-Ergebnisse ausblenden. */
export function toDisplay(messages: MessageParam[]): KiDisplayMessage[] {
  const out: KiDisplayMessage[] = [];
  for (const m of messages) {
    if (m.role !== 'user' && m.role !== 'assistant') continue;
    if (typeof m.content === 'string') {
      out.push({ role: m.role, text: m.content, tools: [] });
      continue;
    }
    const blocks = m.content;
    if (m.role === 'user') {
      const results = blocks.filter((b) => b.type === 'tool_result') as Anthropic.Beta.BetaToolResultBlockParam[];
      if (results.length && out.length && out[out.length - 1].role === 'assistant') {
        const last = out[out.length - 1];
        // Erfolg je Werkzeug anhand des is_error-Flags nachtragen (Reihenfolge = Reihenfolge der tool_use-Blöcke)
        const offset = last.tools.length - results.length;
        results.forEach((r, i) => {
          if (offset >= 0 && last.tools[offset + i]) last.tools[offset + i].ok = !r.is_error;
        });
        continue;
      }
      const texts = blocks.filter((b): b is Anthropic.Beta.BetaTextBlockParam => b.type === 'text' && !b.text.startsWith(STATE_TAG));
      if (texts.length) out.push({ role: 'user', text: texts.map((t) => t.text).join('\n'), tools: [] });
      continue;
    }
    const text = blocks.filter((b): b is Anthropic.Beta.BetaTextBlockParam => b.type === 'text').map((b) => b.text.trim()).filter(Boolean).join('\n\n');
    const tools = blocks
      .filter((b): b is Anthropic.Beta.BetaToolUseBlockParam => b.type === 'tool_use')
      .map((b) => ({ name: b.name as ToolName, ok: true }));
    if (!text && !tools.length) continue;
    const prev = out[out.length - 1];
    // Aufeinanderfolgende Assistenten-Abschnitte (vor und nach einer Aktion) zu einer Blase zusammenfassen
    if (prev?.role === 'assistant') {
      prev.text = [prev.text, text].filter(Boolean).join('\n\n');
      prev.tools.push(...tools);
    } else out.push({ role: 'assistant', text, tools });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Werkzeuge
// ---------------------------------------------------------------------------

const Localized = z.object({ de: z.string().max(2000), en: z.string().max(2000).optional() });
const LocalizedList = z.object({ de: z.array(z.string().max(1500)).max(12), en: z.array(z.string().max(1500)).max(12).optional() });

const UpdateInput = z.object({
  title: Localized.optional(),
  location: Localized.optional(),
  summary: Localized.optional(),
  description: LocalizedList.optional(),
  purpose: Localized.optional(),
  risks: LocalizedList.optional(),
  assetType: z.enum(['company', 'real_estate', 'energy', 'collectible']).optional(),
  tokenModel: z.enum(['erc20', 'erc721', 'erc1155']).optional(),
  targetAmountChf: z.number().int().optional(),
  minInvestmentChf: z.number().int().optional(),
  deadline: z.string().optional(),
  collateralType: z.enum(['none', 'pledge', 'guarantee', 'milestone_payout']).optional(),
  collateralNote: z.string().max(1000).nullable().optional(),
});

const DocumentInput = z.object({
  kind: z.enum(['business_plan', 'financing_concept', 'prospectus', 'other']),
  titleDe: z.string().min(3).max(160),
  titleEn: z.string().min(3).max(160),
  subtitle: z.string().max(200).optional(),
  markdown: z.string().min(200).max(120_000),
  visibility: z.enum(['public', 'members']).optional(),
});

const SubmitInput = z.object({ bestaetigt: z.boolean() });

const TOOLS: Anthropic.Beta.BetaToolUnion[] = [
  {
    name: 'projekt_aktualisieren',
    description:
      'Speichert Projektfelder im Entwurf. Nur die übergebenen Felder werden geändert. Texte immer auf Deutsch (de) und Englisch (en). Grenzen: title/location 120 Zeichen, summary/purpose 300 Zeichen, description bis 12 Absätze à 1500 Zeichen, risks bis 12 Punkte à 400 Zeichen, targetAmountChf ganze Franken ab 10000, minInvestmentChf 100 bis 20000, deadline YYYY-MM-DD in der Zukunft. collateralNote beschreibt die Sicherheit (Pflicht, wenn collateralType nicht none).',
    eager_input_streaming: true,
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'object', properties: { de: { type: 'string' }, en: { type: 'string' } }, required: ['de'] },
        location: { type: 'object', properties: { de: { type: 'string' }, en: { type: 'string' } }, required: ['de'] },
        summary: { type: 'object', properties: { de: { type: 'string' }, en: { type: 'string' } }, required: ['de'] },
        description: { type: 'object', properties: { de: { type: 'array', items: { type: 'string' } }, en: { type: 'array', items: { type: 'string' } } }, required: ['de'] },
        purpose: { type: 'object', properties: { de: { type: 'string' }, en: { type: 'string' } }, required: ['de'] },
        risks: { type: 'object', properties: { de: { type: 'array', items: { type: 'string' } }, en: { type: 'array', items: { type: 'string' } } }, required: ['de'] },
        assetType: { type: 'string', enum: ['company', 'real_estate', 'energy', 'collectible'] },
        tokenModel: { type: 'string', enum: ['erc20', 'erc721', 'erc1155'] },
        targetAmountChf: { type: 'integer' },
        minInvestmentChf: { type: 'integer' },
        deadline: { type: 'string', description: 'YYYY-MM-DD' },
        collateralType: { type: 'string', enum: ['none', 'pledge', 'guarantee', 'milestone_payout'] },
        collateralNote: { type: ['string', 'null'] },
      },
    },
  },
  {
    name: 'dokument_erstellen',
    description:
      'Erstellt aus Markdown ein PDF und legt es als Projektdokument ab (Businessplan, Finanzierungskonzept, Projektbeschrieb oder Sonstiges). Markdown mit Überschriften (#, ##, ###), Absätzen und Listen; keine Tabellen. Inhalt ausschliesslich aus den Angaben des Kapitalnehmers; Annahmen als solche kennzeichnen; keine Renditeversprechen. Sichtbarkeit: members (Standard, nur angemeldete Nutzer) oder public.',
    eager_input_streaming: true,
    input_schema: {
      type: 'object',
      properties: {
        kind: { type: 'string', enum: ['business_plan', 'financing_concept', 'prospectus', 'other'] },
        titleDe: { type: 'string' },
        titleEn: { type: 'string' },
        subtitle: { type: 'string', description: 'z. B. Firma, Ort, Datum' },
        markdown: { type: 'string' },
        visibility: { type: 'string', enum: ['public', 'members'] },
      },
      required: ['kind', 'titleDe', 'titleEn', 'markdown'],
    },
  },
  {
    name: 'vorpruefung_starten',
    description:
      'Führt die Vorprüfung aus: liest alle Projektangaben und hochgeladenen Dokumente und liefert Urteil (ready, needs_work, not_suitable), Punktzahl, Prüfpunkte, Dokument-Befunde und offene Punkte. Dauert ein bis zwei Minuten. Nur ausführen, wenn Angaben und Dokumente weitgehend vollständig sind, und erneut nach wesentlichen Änderungen.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'einreichen',
    description:
      'Reicht das Projekt bei LIQUODA zur manuellen Prüfung ein (Status «in Prüfung», danach eingefroren). Voraussetzungen: aktuelle Vorprüfung mit Urteil ready, alle Pflichtangaben vollständig, und der Kapitalnehmer hat im Gespräch ausdrücklich bestätigt, dass die Angaben wahr und vollständig sind und er berechtigt ist, das Projekt anzubieten. bestaetigt nur dann auf true setzen.',
    input_schema: { type: 'object', properties: { bestaetigt: { type: 'boolean' } }, required: ['bestaetigt'] },
  },
];

const OWN_COLUMNS =
  'id, slug, title, summary, description, purpose, location, risks, asset_type, target_amount_chf, min_investment_chf, raised_amount_chf, deadline, status, token_model, collateral_type, collateral_note, cover_image_path, gallery_paths, review_note, ai_unlocked_at, created_at, updated_at';

async function loadProject(projectId: string): Promise<{ project: OwnProject; documents: DocumentRecord[] } | null> {
  const admin = getSupabaseAdmin();
  const [{ data: project }, { data: documents }] = await Promise.all([
    admin.from('projects').select(OWN_COLUMNS).eq('id', projectId).maybeSingle(),
    admin.from('documents').select('*').eq('project_id', projectId).is('investment_id', null).order('created_at', { ascending: true }),
  ]);
  if (!project) return null;
  return { project: project as unknown as OwnProject, documents: (documents ?? []) as DocumentRecord[] };
}

interface ToolContext {
  projectId: string;
  locale: 'de' | 'en';
  changed: boolean;
}

/** Werkzeug ausführen; Rückgabe als JSON-Text für das Modell. */
async function executeTool(name: ToolName, input: unknown, ctx: ToolContext): Promise<{ ok: boolean; result: string }> {
  const loaded = await loadProject(ctx.projectId);
  if (!loaded) return { ok: false, result: JSON.stringify({ error: 'not_found' }) };
  const { project, documents } = loaded;
  const admin = getSupabaseAdmin();
  const editable = project.status === 'draft';

  switch (name) {
    case 'projekt_aktualisieren': {
      const parsed = UpdateInput.safeParse(input);
      if (!parsed.success) return { ok: false, result: JSON.stringify({ error: 'invalid_input', details: parsed.error.issues.slice(0, 5) }) };
      if (!editable) return { ok: false, result: JSON.stringify({ error: 'locked', hint: 'Das Projekt ist nicht im Entwurf und kann nicht geändert werden.' }) };
      const { update, fields } = validateProjectUpdate(parsed.data as Record<string, unknown>);
      if (fields.length) return { ok: false, result: JSON.stringify({ error: 'validation', fields }) };
      if (Object.keys(update).length === 0) return { ok: true, result: JSON.stringify({ success: true, changed: [] }) };
      const { error } = await admin.from('projects').update(update).eq('id', project.id).eq('status', 'draft');
      if (error) return { ok: false, result: JSON.stringify({ error: 'server' }) };
      ctx.changed = true;
      return { ok: true, result: JSON.stringify({ success: true, changed: Object.keys(update) }) };
    }
    case 'dokument_erstellen': {
      const parsed = DocumentInput.safeParse(input);
      if (!parsed.success) return { ok: false, result: JSON.stringify({ error: 'invalid_input', details: parsed.error.issues.slice(0, 5) }) };
      if (!editable) return { ok: false, result: JSON.stringify({ error: 'locked' }) };
      const d = parsed.data;
      const date = new Date().toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const footer = `Erstellt mit dem LIQUODA KI-Assistenten auf Basis der Angaben des Kapitalnehmers, ${date}. Der Kapitalnehmer verantwortet den Inhalt. Keine Anlage-, Rechts- oder Steuerberatung, keine Renditezusage.`;
      const bytes = await markdownToPdf({ title: d.titleDe, subtitle: d.subtitle, markdown: d.markdown, footer });
      const file = new File([Buffer.from(bytes)], `${d.kind}.pdf`, { type: 'application/pdf' });
      const stored = await storeDocument({
        projectId: project.id,
        type: d.kind as DocumentType,
        title: { de: d.titleDe, en: d.titleEn },
        file,
        visibility: d.visibility ?? 'members',
      });
      if (!stored.ok) return { ok: false, result: JSON.stringify({ error: stored.error }) };
      ctx.changed = true;
      return {
        ok: true,
        result: JSON.stringify({ success: true, documentId: stored.document.id, version: stored.document.version, pages: 'PDF', downloadPath: `/api/dokumente/${stored.document.id}` }),
      };
    }
    case 'vorpruefung_starten': {
      try {
        const record = await runPrecheck({ project, documents, locale: ctx.locale });
        ctx.changed = true;
        return { ok: true, result: JSON.stringify({ success: true, precheckId: record.id, ...record.result }) };
      } catch (err) {
        console.error('[ki/vorpruefung]', err instanceof Error ? err.message : err);
        return { ok: false, result: JSON.stringify({ error: 'precheck_failed' }) };
      }
    }
    case 'einreichen': {
      const parsed = SubmitInput.safeParse(input);
      if (!parsed.success || !parsed.data.bestaetigt) return { ok: false, result: JSON.stringify({ error: 'not_confirmed', hint: 'Zuerst die ausdrückliche Bestätigung des Kapitalnehmers einholen.' }) };
      if (!editable) return { ok: false, result: JSON.stringify({ error: 'locked' }) };
      const precheck = await latestPrecheck(project.id);
      if (!precheck) return { ok: false, result: JSON.stringify({ error: 'precheck_missing', hint: 'Zuerst vorpruefung_starten ausführen.' }) };
      if (precheck.verdict !== 'ready') return { ok: false, result: JSON.stringify({ error: 'precheck_not_ready', verdict: precheck.verdict, openPoints: precheck.result.openPoints }) };
      if (new Date(precheck.created_at) < new Date(project.updated_at)) return { ok: false, result: JSON.stringify({ error: 'precheck_outdated', hint: 'Das Projekt wurde nach der Vorprüfung geändert; Vorprüfung wiederholen.' }) };
      const result = await submitProject(admin, project, documents);
      if (!result.ok) return { ok: false, result: JSON.stringify({ error: result.error, problems: result.problems }) };
      ctx.changed = true;
      return { ok: true, result: JSON.stringify({ success: true, status: 'in_review', slug: result.slug }) };
    }
  }
}

// ---------------------------------------------------------------------------
// System-Prompt
// ---------------------------------------------------------------------------

const ASSISTANT_SYSTEM = `Du bist der KI-Assistent von LIQUODA für Kapitalnehmer. Du hilfst einer Person, ihr Projekt auf liquoda.com vollständig, sachlich und regelkonform zu erfassen, erledigst dabei alles, was du selbst tun kannst, prüfst alles vor und übergibst das Projekt danach an LIQUODA zur manuellen Prüfung und Freigabe. LIQUODA entscheidet; du bereitest vor.

Arbeitsweise
1. Beginn: Begrüsse kurz, sag in zwei Sätzen, was du tun kannst, schau dir den Projektstand an und schlage den nächsten Schritt vor. Stelle höchstens drei Fragen auf einmal, in einfacher Sprache, ohne Fachbegriffe. Frage nur, was du wirklich brauchst; nutze vorhandene Angaben.
2. Felder: Sobald du genug weisst, speichere mit projekt_aktualisieren. Immer Deutsch und Englisch. Schweizer Schreibweise («ss» statt «ß»). Kurzbeschreibung höchstens 300 Zeichen, Verwendung des Kapitals höchstens 300 Zeichen, Beschreibung drei bis sechs Absätze, Risiken drei bis acht konkrete Punkte. Sachlich, ruhig, keine Werbesprache, keine Rendite- oder Gewinnaussagen, keine Dringlichkeit, keine Begriffe wie «versichert», «geschützt» oder «garantiert».
3. Beträge: Zielbetrag ganze Franken ab CHF 10'000, Mindestbetrag je Beteiligung CHF 100 bis 20'000 (üblich: CHF 100 bis 1'000), Laufzeit als letzter Tag der Finanzierungsphase (empfiehl 60 bis 120 Tage ab heute), Art der Anteile: erc20 für Anteile an Unternehmen, Immobilien und Energieprojekten, erc721 für ein einzelnes Objekt wie eine Uhr oder ein Fahrzeug. Absicherung: erkläre die vier Möglichkeiten in einfachen Worten (keine Sicherheit; Pfand; Garantie oder Bürgschaft; Auszahlung nach Meilensteinen) und frage, was zutrifft. LIQUODA bewertet Sicherheiten nicht.
4. Dokumente: Nenne die Pflichtdokumente für die Asset-Art. Schreibe selbst, was du aus den Angaben schreiben kannst: Businessplan (Unternehmen), Finanzierungskonzept (Immobilie), Projektbeschrieb (Energie), auf Wunsch zusätzlich ein Projektbeschrieb für jede Art. Amtliche und fremde Unterlagen (Grundbuchauszug, Handelsregisterauszug, Jahresrechnung, Gutachten, Eigentumsnachweis, Versicherungsnachweis, Ertragsgutachten, Abnahmevertrag) muss der Kapitalnehmer selbst beschaffen und im Schritt «Dokumente» hochladen; erkläre, wo man sie in der Schweiz bekommt (z. B. Grundbuchamt des Kantons, Handelsregisteramt oder zefix.ch, Treuhänder, Versicherung). Das Titelbild ist Pflicht und wird im Schritt «Bilder» hochgeladen; du kannst keine Bilder erstellen.
5. Dokumente schreiben: Erst befragen, dann schreiben. Businessplan: Unternehmen und Angebot, Markt und Kunden, Team, bisherige Zahlen, Planung der nächsten drei Jahre als Annahmen des Kapitalnehmers, Verwendung des Kapitals, Risiken; 1'500 bis 3'000 Wörter. Finanzierungskonzept: Objekt, Kosten (Kauf, Sanierung, Nebenkosten), Finanzierungsstruktur (Eigenmittel, Hypothek, LIQUODA-Runde), Verwendung, Beteiligungsmodell und Rückführung, Risiken. Projektbeschrieb: Anlage, Standort, Technik, Leistung, Ertragsgrundlage laut Gutachten, Verträge, Zeitplan, Risiken. Nur Angaben des Kapitalnehmers verwenden, nichts erfinden; Annahmen kennzeichnen; keine Zusagen an Investoren. Markdown ohne Tabellen. Danach: Der Kapitalnehmer soll das PDF lesen und verantwortet den Inhalt; Änderungswünsche setzt du um (neue Version).
6. Vorprüfung: Wenn Angaben und Dokumente weitgehend vollständig sind, führe vorpruefung_starten aus (sag vorher, dass es ein bis zwei Minuten dauert). Besprich das Ergebnis: behebe, was du beheben kannst, und liste klar, was der Kapitalnehmer noch tun muss. Nach wesentlichen Änderungen wiederholen.
7. Einreichen: Nur wenn die aktuelle Vorprüfung «ready» ergibt und der Kapitalnehmer im Gespräch ausdrücklich bestätigt hat, dass die Angaben wahr und vollständig sind und er berechtigt ist, das Projekt anzubieten. Frage diese Bestätigung wörtlich ab. Dann einreichen mit bestaetigt=true. Danach ist das Projekt eingefroren; LIQUODA prüft manuell und meldet sich per E-Mail. Erkläre das.

Regeln
- Erfinde keine Fakten, Zahlen, Namen oder Dokumente. Wenn etwas fehlt, frage.
- Keine Anlage-, Rechts- oder Steuerberatung; verweise bei solchen Fragen auf Fachpersonen. Keine Rendite- oder Gewinnversprechen, weder gegenüber dem Kapitalnehmer noch in Texten für Investoren.
- Wenn das Projekt nicht im Entwurf ist (Status nicht draft), kannst du nur Fragen beantworten und erklären, was als Nächstes passiert.
- Nenne dem Nutzer keine Werkzeugnamen; beschreibe in einfachen Worten, was du getan hast und was als Nächstes kommt. Sag nach jeder Aktion kurz, was gespeichert wurde.
- Antworte in der Sprache des Nutzers ({LOCALE}). Kurze, klare Antworten im Gespräch; ausführlich nur in Dokumenten. Verwende Absätze und, wo sinnvoll, kurze Listen; keine Überschriften im Chat.
- Der aktuelle Projektstand steht in jeder Nutzernachricht im Block <projektstand>. Er ist massgebend; wiederhole ihn nicht.`;

// ---------------------------------------------------------------------------
// Lauf
// ---------------------------------------------------------------------------

const MAX_ITERATIONS = 10;

export async function runAssistant(params: {
  project: OwnProject;
  documents: DocumentRecord[];
  locale: 'de' | 'en';
  userName: string;
  message: string;
  emit: (event: KiEvent) => void;
}): Promise<void> {
  const client = getAnthropic();
  const messages = await loadConversation(params.project.id);
  const today = new Date().toISOString().slice(0, 10);
  const precheck = await latestPrecheck(params.project.id);
  const state = [
    `${STATE_TAG}`,
    `Heute: ${today} · Kapitalnehmer: ${params.userName}`,
    projectFacts(params.project, params.documents),
    `Letzte Vorprüfung: ${precheck ? `${precheck.verdict} (${precheck.score}/100, ${precheck.created_at.slice(0, 16).replace('T', ' ')})` : 'keine'}`,
    '</projektstand>',
  ].join('\n');

  messages.push({ role: 'user', content: [{ type: 'text', text: state }, { type: 'text', text: params.message }] });
  const ctx: ToolContext = { projectId: params.project.id, locale: params.locale, changed: false };
  let jsonRetries = 0;

  try {
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const stream = client.beta.messages.stream({
        model: KI_MODEL,
        max_tokens: 64000,
        betas: KI_BETAS,
        fallbacks: 'default',
        thinking: { type: 'adaptive' },
        output_config: { effort: 'high' },
        system: [
          { type: 'text', text: LIQUODA_WISSEN },
          { type: 'text', text: ASSISTANT_SYSTEM.replace('{LOCALE}', params.locale === 'en' ? 'Englisch' : 'Deutsch'), cache_control: { type: 'ephemeral' } },
        ],
        tools: TOOLS,
        messages,
      });
      stream.on('text', (delta) => params.emit({ type: 'text', text: delta }));

      let response: Anthropic.Beta.BetaMessage;
      try {
        response = await stream.finalMessage();
        jsonRetries = 0;
      } catch (err) {
        if (err instanceof Anthropic.APIError || jsonRetries++ >= 2) throw err;
        console.error('[ki] Werkzeug-Eingabe nicht lesbar, Durchgang wiederholt');
        continue;
      }

      messages.push({ role: 'assistant', content: response.content });
      await saveConversation(params.project.id, messages, i === 0 ? 1 : 0);

      if (response.stop_reason === 'refusal') {
        params.emit({ type: 'error', code: 'refusal' });
        break;
      }
      const toolUses = response.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use');
      if (response.stop_reason === 'max_tokens' && toolUses.length) {
        params.emit({ type: 'error', code: 'truncated' });
        break;
      }
      if (response.stop_reason === 'pause_turn') continue;
      if (toolUses.length === 0) break;

      const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
      for (const use of toolUses) {
        const name = use.name as ToolName;
        if (!TOOL_NAMES.includes(name)) {
          results.push({ type: 'tool_result', tool_use_id: use.id, is_error: true, content: 'unknown_tool' });
          continue;
        }
        params.emit({ type: 'tool', name, status: 'start' });
        const { ok, result } = await executeTool(name, use.input, ctx);
        params.emit({ type: 'tool', name, status: ok ? 'ok' : 'error' });
        results.push({ type: 'tool_result', tool_use_id: use.id, is_error: !ok, content: result });
      }
      messages.push({ role: 'user', content: results });
      await saveConversation(params.project.id, messages, 0);
    }
    params.emit({ type: 'done', changed: ctx.changed });
  } catch (err) {
    // Letzte Nutzernachricht ohne Antwort nicht behalten, damit der Verlauf gültig bleibt
    if (messages[messages.length - 1]?.role === 'user') {
      messages.pop();
      await saveConversation(params.project.id, messages, 0);
    }
    throw err;
  }
}
