import { NextRequest, NextResponse } from 'next/server';
import {
  cleanLocalized,
  cleanLocalizedList,
  isAssetType,
  isTokenModel,
  MIN_INVESTMENT_FLOOR_CHF,
  MIN_TARGET_CHF,
  requireEmittent,
} from '../../_lib';
import { MAX_INVESTMENT_CHF } from '@/lib/fees';
import { COLLATERAL_TYPES } from '@/lib/projects/types';
import { cleanText } from '../../_lib';

const UUID_RE = /^[0-9a-f-]{36}$/i;

/** Entwurf speichern (Wizard-Schritte 1 bis 3). Nur im Status draft. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await requireEmittent();
  if ('error' in ctx) return ctx.error;
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const { data: current } = await ctx.supabase.from('projects').select('id, status').eq('id', params.id).maybeSingle();
  if (!current) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (current.status !== 'draft') return NextResponse.json({ error: 'locked' }, { status: 409 });

  const update: Record<string, unknown> = {};
  const fields: string[] = [];

  if ('title' in body) update.title = cleanLocalized(body.title, 120);
  if ('summary' in body) update.summary = cleanLocalized(body.summary, 300);
  if ('purpose' in body) update.purpose = cleanLocalized(body.purpose, 300);
  if ('location' in body) update.location = cleanLocalized(body.location, 120);
  if ('description' in body) update.description = cleanLocalizedList(body.description, 12, 1500);
  if ('risks' in body) update.risks = cleanLocalizedList(body.risks, 12, 400);
  if ('assetType' in body) {
    if (isAssetType(body.assetType)) update.asset_type = body.assetType;
    else fields.push('assetType');
  }
  if ('tokenModel' in body) {
    if (isTokenModel(body.tokenModel)) update.token_model = body.tokenModel;
    else fields.push('tokenModel');
  }
  if ('targetAmountChf' in body) {
    const n = Number(body.targetAmountChf);
    if (Number.isInteger(n) && n >= MIN_TARGET_CHF && n <= 100_000_000) update.target_amount_chf = n;
    else fields.push('targetAmountChf');
  }
  if ('minInvestmentChf' in body) {
    const n = Number(body.minInvestmentChf);
    if (Number.isInteger(n) && n >= MIN_INVESTMENT_FLOOR_CHF && n <= MAX_INVESTMENT_CHF) update.min_investment_chf = n;
    else fields.push('minInvestmentChf');
  }
  if ('collateralType' in body) {
    if (typeof body.collateralType === 'string' && (COLLATERAL_TYPES as readonly string[]).includes(body.collateralType)) update.collateral_type = body.collateralType;
    else fields.push('collateralType');
  }
  if ('collateralNote' in body) update.collateral_note = cleanText(body.collateralNote, 1000) || null;
  if ('deadline' in body) {
    const s = typeof body.deadline === 'string' ? body.deadline : '';
    const d = new Date(`${s}T00:00:00`);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(d.getTime()) && d > new Date()) update.deadline = s;
    else fields.push('deadline');
  }

  if (fields.length) return NextResponse.json({ error: 'validation', fields }, { status: 400 });
  if (Object.keys(update).length === 0) return NextResponse.json({ success: true });

  const { error } = await ctx.supabase.from('projects').update(update).eq('id', params.id);
  if (error) {
    console.error('[emittent/projekte] update:', error.message);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
