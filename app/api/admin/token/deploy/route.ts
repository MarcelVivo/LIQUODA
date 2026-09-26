import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib';
import { deployProjectToken, hasChainEnv, registerDocumentHash } from '@/lib/chain/token';

/**
 * Token-Vertrag für ein freigegebenes Projekt anlegen (Spec, Abschnitt 8).
 * Cap = Zielbetrag, 1 Token = CHF 1. Vorhandene Dokument-Hashes werden verankert.
 */
export async function POST(req: NextRequest) {
  const ctx = await requireAdmin();
  if ('error' in ctx) return ctx.error;
  if (!hasChainEnv()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const projectId = typeof body.projectId === 'string' ? body.projectId : '';
  if (!projectId) return NextResponse.json({ error: 'validation' }, { status: 400 });

  const { data: project } = await ctx.admin
    .from('projects')
    .select('id, slug, title, status, target_amount_chf, token_model, token_contract_address')
    .eq('id', projectId)
    .maybeSingle();
  if (!project) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (project.token_contract_address) return NextResponse.json({ error: 'already_deployed' }, { status: 409 });
  if (!['active', 'funded'].includes(project.status)) return NextResponse.json({ error: 'project_not_active' }, { status: 409 });
  if (project.token_model !== 'erc20') return NextResponse.json({ error: 'token_model_unsupported' }, { status: 409 });

  const symbol = `LQD-${project.slug.replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase()}`;
  const name = `LIQUODA ${(project.title as { de: string }).de}`.slice(0, 64);

  try {
    const result = await deployProjectToken({
      name,
      symbol,
      capChf: Number(project.target_amount_chf),
      projectRef: project.id,
    });

    // Vertragsdaten speichern; der Trigger protokolliert mit Admin-Kennung
    const { error } = await ctx.admin.rpc('backend_set_project_token', {
      p_project_id: project.id,
      p_address: result.address,
      p_chain_id: result.chainId,
      p_symbol: symbol,
      p_tx: result.txHash,
      p_actor: ctx.actor,
    });
    if (error) console.error('[admin/token/deploy] save:', error.message);

    // Dokument-Hashes verankern (Spec, Abschnitt 8)
    const { data: docs } = await ctx.admin
      .from('documents')
      .select('id, title, version, sha256_hash')
      .eq('project_id', project.id)
      .is('investment_id', null)
      .not('sha256_hash', 'is', null)
      .is('onchain_tx', null);
    let anchored = 0;
    for (const doc of docs ?? []) {
      try {
        const tx = await registerDocumentHash(result.address, doc.sha256_hash as string, `${(doc.title as { de: string }).de} v${doc.version}`);
        await ctx.admin.from('documents').update({ onchain_tx: tx }).eq('id', doc.id);
        anchored += 1;
      } catch (err) {
        console.error('[admin/token/deploy] document:', err instanceof Error ? err.message : err);
      }
    }

    return NextResponse.json({ success: true, address: result.address, txHash: result.txHash, symbol, anchored });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown';
    console.error('[admin/token/deploy]', message);
    const code = /insufficient funds/i.test(message) ? 'insufficient_funds' : 'chain';
    return NextResponse.json({ error: code, message: message.slice(0, 200) }, { status: 502 });
  }
}
