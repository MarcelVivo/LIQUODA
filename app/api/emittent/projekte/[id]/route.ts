import { NextRequest, NextResponse } from 'next/server';
import { requireEmittent } from '../../_lib';
import { validateProjectUpdate } from '@/lib/emittent-actions';

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

  const { update, fields } = validateProjectUpdate(body);
  if (fields.length) return NextResponse.json({ error: 'validation', fields }, { status: 400 });
  if (Object.keys(update).length === 0) return NextResponse.json({ success: true });

  const { error } = await ctx.supabase.from('projects').update(update).eq('id', params.id);
  if (error) {
    console.error('[emittent/projekte] update:', error.message);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
