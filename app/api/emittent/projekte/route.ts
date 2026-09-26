import { NextResponse } from 'next/server';
import { randomSuffix, requireEmittent } from '../_lib';

/** Neues Projekt als Entwurf anlegen (RLS: nur für die eigene Emittenten-ID). */
export async function POST() {
  const ctx = await requireEmittent();
  if ('error' in ctx) return ctx.error;

  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 90);

  const { data, error } = await ctx.supabase
    .from('projects')
    .insert({
      slug: `projekt-${randomSuffix()}${randomSuffix()}`,
      emittent_id: ctx.profile.id,
      title: { de: 'Neues Projekt', en: 'New project' },
      summary: { de: '', en: '' },
      description: { de: [], en: [] },
      purpose: { de: '', en: '' },
      location: { de: '', en: '' },
      risks: { de: [], en: [] },
      asset_type: 'company',
      target_amount_chf: 10000,
      min_investment_chf: 1000,
      deadline: deadline.toISOString().slice(0, 10),
      status: 'draft',
      token_model: 'erc20',
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('[emittent/projekte] create:', error?.message);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
  return NextResponse.json({ id: data.id });
}
