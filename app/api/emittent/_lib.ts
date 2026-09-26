import { NextResponse } from 'next/server';
import { getAccount, createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { getOwnProfile } from '@/lib/investments';
import { ASSET_TYPES, type AssetType, type Localized, type TokenModel } from '@/lib/projects/types';

export const TOKEN_MODELS: TokenModel[] = ['erc20', 'erc721', 'erc1155'];
export const MIN_TARGET_CHF = 10000;
export const MIN_INVESTMENT_FLOOR_CHF = 100;

/** Eingeloggter Emittent oder Fehlerantwort. */
export async function requireEmittent() {
  if (!hasSupabaseEnv()) return { error: NextResponse.json({ error: 'not_configured' }, { status: 503 }) };
  const account = await getAccount();
  if (!account) return { error: NextResponse.json({ error: 'unauthenticated' }, { status: 401 }) };
  const profile = await getOwnProfile(account.authId);
  if (!profile || profile.role !== 'emittent') return { error: NextResponse.json({ error: 'forbidden' }, { status: 403 }) };
  return { account, profile, supabase: createSupabaseServerClient() };
}

export function cleanText(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
}

export function cleanLocalized(value: unknown, max: number): Localized {
  const v = (value ?? {}) as Record<string, unknown>;
  const de = cleanText(v.de, max);
  const en = cleanText(v.en, max);
  return { de, en: en || de };
}

/** Mehrere Absätze/Zeilen: Array oder durch Leerzeilen getrennter Text. */
export function cleanLocalizedList(value: unknown, maxItems: number, maxLen: number): { de: string[]; en: string[] } {
  const v = (value ?? {}) as Record<string, unknown>;
  const toList = (x: unknown): string[] => {
    const arr = Array.isArray(x) ? x : typeof x === 'string' ? x.split(/\n\s*\n/) : [];
    return arr.map((s) => cleanText(s, maxLen)).filter(Boolean).slice(0, maxItems);
  };
  const de = toList(v.de);
  const en = toList(v.en);
  return { de, en: en.length ? en : de };
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6);
}

export function isAssetType(v: unknown): v is AssetType {
  return typeof v === 'string' && (ASSET_TYPES as readonly string[]).includes(v);
}
export function isTokenModel(v: unknown): v is TokenModel {
  return typeof v === 'string' && TOKEN_MODELS.includes(v as TokenModel);
}
