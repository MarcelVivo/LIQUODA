import { NextRequest, NextResponse } from 'next/server';
import { cleanLocalized, cleanText, requireEmittent } from '../_lib';

/** Öffentliches Profil des Emittenten pflegen (Beschreibung, Website). */
export async function PATCH(req: NextRequest) {
  const ctx = await requireEmittent();
  if ('error' in ctx) return ctx.error;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const update: Record<string, unknown> = {};
  if ('bio' in body) update.bio = cleanLocalized(body.bio, 1500);
  if ('website' in body) {
    const site = cleanText(body.website, 200);
    if (site && !/^https?:\/\/[^\s]+\.[^\s]+$/.test(site)) return NextResponse.json({ error: 'validation', fields: ['website'] }, { status: 400 });
    update.website = site || null;
  }
  const { error } = await ctx.supabase.from('users').update(update).eq('id', ctx.profile.id);
  if (error) {
    console.error('[emittent/profil]', error.message);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
