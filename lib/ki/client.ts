import Anthropic from '@anthropic-ai/sdk';

/**
 * Anthropic-Client für den KI-Assistenten (Kapitalnehmer) und den Support-Bot.
 * Modell: Claude Opus 5 mit serverseitigem Fallback bei Ablehnungen durch die
 * Sicherheitsklassifizierer. Ohne ANTHROPIC_API_KEY bleiben beide Funktionen aus.
 */
export const KI_MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5';
export const KI_BETAS = ['server-side-fallback-2026-07-01'];

export function hasKiEnv(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY ist nicht gesetzt.');
  if (!client) {
    // Schlüssel ohne Workspace-Bindung brauchen die Workspace-ID als Header (Console → Settings → Workspaces)
    const workspace = process.env.ANTHROPIC_WORKSPACE_ID;
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: 10 * 60 * 1000,
      defaultHeaders: workspace ? { 'anthropic-workspace-id': workspace } : undefined,
    });
  }
  return client;
}

/** Fehlercode für die Oberfläche, ohne interne Details. */
export function kiErrorCode(err: unknown): 'rate' | 'auth' | 'refusal' | 'server' {
  if (err instanceof Anthropic.RateLimitError) return 'rate';
  if (err instanceof Anthropic.AuthenticationError) return 'auth';
  if (err instanceof Anthropic.APIError) {
    console.error('[ki] API-Fehler', err.status, err.message);
    return 'server';
  }
  console.error('[ki]', err instanceof Error ? err.message : err);
  return 'server';
}
