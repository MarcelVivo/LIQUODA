import { NextRequest, NextResponse } from 'next/server';
import { requireEmittent } from '../../../../_lib';
import { requestOrigin } from '@/app/api/konto/_lib';
import { getOwnProject } from '@/lib/emittent';
import { hasKiEnv } from '@/lib/ki/client';
import { AI_ASSISTANT_PRICE_CHF } from '@/lib/ki/freischaltung';
import { getStripe, hasStripeEnv } from '@/lib/stripe';
import { getSupabaseAdmin } from '@/lib/supabase';

const UUID_RE = /^[0-9a-f-]{36}$/i;

/** KI-Assistent für ein Projekt freischalten: Stripe Checkout über CHF 190 (einmalig). */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await requireEmittent();
  if ('error' in ctx) return ctx.error;
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (!hasKiEnv() || !hasStripeEnv()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const project = await getOwnProject(params.id);
  if (!project) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (project.ai_unlocked_at) return NextResponse.json({ error: 'already_unlocked' }, { status: 409 });

  const locale = ctx.account.locale === 'en' ? 'en' : 'de';
  const base = `${requestOrigin(req)}${locale === 'en' ? '/en' : ''}/emittent/projekte/${project.id}`;
  const admin = getSupabaseAdmin();

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      currency: 'chf',
      customer_email: ctx.profile.email,
      client_reference_id: project.id,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'chf',
            unit_amount: AI_ASSISTANT_PRICE_CHF * 100,
            product_data: {
              name: locale === 'en' ? 'LIQUODA AI assistant (one-time, per project)' : 'LIQUODA KI-Assistent (einmalig, pro Projekt)',
              description: project.title[locale] || project.title.de || undefined,
            },
          },
        },
      ],
      metadata: { kind: 'ai_assistant', project_id: project.id, emittent_id: ctx.profile.id },
      success_url: `${base}?ki=bezahlt`,
      cancel_url: `${base}?ki=abgebrochen`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });
    const { error } = await admin.from('ai_orders').insert({
      project_id: project.id,
      emittent_id: ctx.profile.id,
      provider: 'stripe',
      provider_ref: session.id,
      amount_chf: AI_ASSISTANT_PRICE_CHF,
      status: 'open',
    });
    if (error) console.error('[ki/freischalten] order:', error.message);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[ki/freischalten] stripe:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'server' }, { status: 502 });
  }
}
