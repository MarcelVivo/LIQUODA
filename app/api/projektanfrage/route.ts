import { NextRequest, NextResponse } from 'next/server';

/**
 * Projektanfrage von der Seite «Für Emittenten».
 *
 * Etappe 1: serverseitige Validierung und Protokollierung.
 * Es wird bewusst keine Supabase-Tabelle angelegt.
 *
 * TODO (Etappe 3): E-Mail-Versand an LIQUODA (info@liquoda.com) und
 * Eingangsbestätigung an den Absender; Ablage der Anfrage in Supabase
 * mit RLS, sobald das Datenmodell aus Spec Abschnitt 6 steht.
 */

const ASSET_TYPES = ['company', 'real_estate', 'energy', 'collectible', 'other'] as const;
type AssetType = (typeof ASSET_TYPES)[number];

const LIMITS = {
  name: 120,
  company: 160,
  email: 254,
  descriptionMin: 20,
  descriptionMax: 2000,
  amountMax: 1_000_000_000,
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Payload = {
  name: string;
  company: string | null;
  email: string;
  assetType: AssetType;
  amount: number | null;
  description: string;
};

function cleanString(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  // Steuerzeichen entfernen, Whitespace normalisieren, Länge begrenzen
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);
}

function validate(body: unknown): { ok: true; data: Payload } | { ok: false; fields: string[] } {
  const b = (body ?? {}) as Record<string, unknown>;
  const fields: string[] = [];

  const name = cleanString(b.name, LIMITS.name);
  if (!name) fields.push('name');

  const company = cleanString(b.company, LIMITS.company) || null;

  const email = cleanString(b.email, LIMITS.email).toLowerCase();
  if (!email || !EMAIL_RE.test(email)) fields.push('email');

  const assetType = typeof b.assetType === 'string' ? b.assetType : '';
  if (!ASSET_TYPES.includes(assetType as AssetType)) fields.push('assetType');

  let amount: number | null = null;
  if (b.amount !== null && b.amount !== undefined && b.amount !== '') {
    const n = typeof b.amount === 'number' ? b.amount : Number(b.amount);
    if (!Number.isInteger(n) || n <= 0 || n > LIMITS.amountMax) fields.push('amount');
    else amount = n;
  }

  const description = cleanString(b.description, LIMITS.descriptionMax);
  if (description.length < LIMITS.descriptionMin) fields.push('description');

  if (fields.length > 0) return { ok: false, fields };
  return {
    ok: true,
    data: { name, company, email, assetType: assetType as AssetType, amount, description },
  };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const result = validate(body);
  if (!result.ok) {
    return NextResponse.json({ error: 'validation', fields: result.fields }, { status: 400 });
  }

  // Protokollierung (Vercel-Logs). Keine Weitergabe an Dritte.
  console.info('[projektanfrage]', {
    receivedAt: new Date().toISOString(),
    ...result.data,
  });

  // TODO (Etappe 3): E-Mail-Versand und Ablage in Supabase, siehe Kopf der Datei.

  return NextResponse.json({ success: true });
}
