import type Anthropic from '@anthropic-ai/sdk';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAnthropic, KI_BETAS, KI_MODEL } from './client';
import { LIQUODA_WISSEN } from './wissen';

/**
 * Support- und Orientierungs-Bot auf der Website: beantwortet Fragen zu LIQUODA,
 * erklärt den Ablauf, verweist auf die passenden Seiten und ermutigt sachlich,
 * ein Projekt zu erfassen oder Projekte anzusehen. Keine Anlageberatung.
 */

export const SUPPORT_MAX_HISTORY = 16;
export const SUPPORT_MAX_CHARS = 2000;

const SUPPORT_SYSTEM = `Du bist der Assistent auf der Website von LIQUODA. Besucher stellen dir Fragen, bevor oder während sie sich registrieren. Du antwortest ausschliesslich auf Grundlage der Wissensbasis; was dort nicht steht, weisst du nicht. Dann sag das und verweise auf info@liquoda.com.

Ziele
- Erklären, was LIQUODA ist, wie der Ablauf für Investoren und Kapitalnehmer funktioniert, was es kostet, wie Sicherheit und Technik funktionieren und was LIQUODA bewusst nicht ist.
- Vertrauen durch Klarheit: Nenne Risiken offen, sobald es um Beteiligungen geht. Keine Beschönigung.
- Nächsten Schritt anbieten, ohne zu drängen: Interessierten Kapitalnehmern die Seite «Für Kapitalnehmer» und die Projektanfrage oder die Registrierung nennen; Interessierten Investoren die Projekte und die Registrierung nennen. Ein Hinweis pro Antwort genügt, als Link.

Regeln
- Keine Rendite- oder Gewinnaussagen, keine Prognosen, keine Empfehlung für oder gegen ein bestimmtes Projekt, keine Anlage-, Rechts- oder Steuerberatung. Bei solchen Fragen: sachlich erklären, was LIQUODA anbietet, und auf Fachpersonen verweisen.
- Keine Werbesprache, keine Dringlichkeit, keine Superlative. Ruhig, klar, freundlich. Kurze Absätze; höchstens etwa 120 Wörter, ausser der Nutzer bittet um mehr.
- Erfinde keine Zahlen, Projekte, Fristen oder Kontaktpersonen. Nenne Preise nur, wie sie in der Wissensbasis stehen, und mit dem Hinweis, dass es Planannahmen sind.
- Sprache: Antworte in der Sprache des Nutzers; Standard ist {LANGUAGE}. Auf Deutsch Schweizer Schreibweise («ss» statt «ß»), höfliche Anrede «Sie».
- Links als Markdown mit den Pfaden aus der Wissensbasis, mit Präfix {PREFIX} vor dem Pfad (z. B. [Projekte]({PREFIX}/projekte)). Keine externen Links ausser E-Mail an info@liquoda.com.
- Du bist ein KI-Assistent und kein Mensch; sag das, wenn du gefragt wirst. Du kannst keine Konten anlegen, Zahlungen auslösen oder Projekte freigeben.
- Latency-sensitive; begin your visible answer immediately.`;

interface SupportTurn {
  role: 'user' | 'assistant';
  content: string;
}

export function sanitizeHistory(input: unknown): SupportTurn[] {
  if (!Array.isArray(input)) return [];
  const turns: SupportTurn[] = [];
  for (const item of input.slice(-SUPPORT_MAX_HISTORY)) {
    if (!item || typeof item !== 'object') continue;
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string' || !content.trim()) continue;
    turns.push({ role, content: content.slice(0, SUPPORT_MAX_CHARS) });
  }
  // Muss mit «user» beginnen und abwechseln
  const out: SupportTurn[] = [];
  for (const t of turns) {
    if (out.length === 0 && t.role !== 'user') continue;
    if (out.length && out[out.length - 1].role === t.role) {
      out[out.length - 1] = { role: t.role, content: `${out[out.length - 1].content}\n${t.content}` };
    } else out.push(t);
  }
  return out;
}

/** Antwort streamen; gibt den vollständigen Text zurück (für das Protokoll). */
export async function streamSupportAnswer(params: {
  history: SupportTurn[];
  locale: 'de' | 'en';
  onText: (delta: string) => void;
}): Promise<string> {
  const client = getAnthropic();
  const system = SUPPORT_SYSTEM.replace('{LANGUAGE}', params.locale === 'en' ? 'Englisch' : 'Deutsch').replace(/\{PREFIX\}/g, params.locale === 'en' ? '/en' : '');
  const stream = client.beta.messages.stream({
    model: KI_MODEL,
    max_tokens: 2000,
    betas: KI_BETAS,
    fallbacks: 'default',
    thinking: { type: 'adaptive' },
    output_config: { effort: 'low' },
    system: [
      { type: 'text', text: LIQUODA_WISSEN },
      { type: 'text', text: system, cache_control: { type: 'ephemeral' } },
    ],
    messages: params.history.map((t) => ({ role: t.role, content: t.content })) as Anthropic.Beta.BetaMessageParam[],
  });
  stream.on('text', params.onText);
  const message = await stream.finalMessage();
  if (message.stop_reason === 'refusal') return '';
  return message.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text').map((b) => b.text).join('');
}

export async function logSupportTurns(sessionId: string, locale: string, turns: SupportTurn[]): Promise<void> {
  if (!turns.length) return;
  const { error } = await getSupabaseAdmin()
    .from('ai_support_messages')
    .insert(turns.map((t) => ({ session_id: sessionId, locale, role: t.role, content: t.content })));
  if (error) console.error('[ki/support] log:', error.message);
}
