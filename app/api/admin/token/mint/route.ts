import { NextRequest, NextResponse } from 'next/server';
import type { Address } from 'viem';
import { requireAdmin } from '../../_lib';
import { hasChainEnv, isAllowed, mintTokens, setAllowed } from '@/lib/chain/token';
import { daysUntil } from '@/lib/format';

/**
 * Mint-Freigabe (Spec, Abschnitt 7, Schritte 5 bis 7):
 * Backend prüft Zahlung, Projektstatus, Laufzeit, KYC und Wallet; setzt die Allowlist,
 * mintet in die Wallet des Investors, speichert die Token-Referenz, Investition -> confirmed.
 */
export async function POST(req: NextRequest) {
  const ctx = await requireAdmin();
  if ('error' in ctx) return ctx.error;
  if (!hasChainEnv()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const investmentId = typeof body.investmentId === 'string' ? body.investmentId : '';
  if (!investmentId) return NextResponse.json({ error: 'validation' }, { status: 400 });

  const { data: inv } = await ctx.admin
    .from('investments')
    .select('id, amount_chf, status, project:projects(id, status, deadline, token_contract_address), investor:users!investments_investor_id_fkey(id, kyc_status, wallet_address)')
    .eq('id', investmentId)
    .maybeSingle();
  if (!inv) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const project = inv.project as unknown as { id: string; status: string; deadline: string; token_contract_address: string | null } | null;
  const investor = inv.investor as unknown as { id: string; kyc_status: string; wallet_address: string | null } | null;

  const problems: string[] = [];
  if (inv.status !== 'paid') problems.push('not_paid');
  if (!project || !['active', 'funded'].includes(project.status)) problems.push('project_not_active');
  if (project && project.status === 'active' && daysUntil(project.deadline) < 0) problems.push('deadline_passed');
  if (!project?.token_contract_address) problems.push('no_contract');
  if (investor?.kyc_status !== 'approved') problems.push('kyc_not_approved');
  if (!investor?.wallet_address) problems.push('no_wallet');
  if (problems.length) return NextResponse.json({ error: 'preconditions', problems }, { status: 409 });

  const contract = project!.token_contract_address as Address;
  const wallet = investor!.wallet_address as Address;
  try {
    if (!(await isAllowed(contract, wallet))) await setAllowed(contract, wallet);
    const txHash = await mintTokens(contract, wallet, Number(inv.amount_chf), inv.id);
    const { error } = await ctx.admin.rpc('backend_confirm_investment', {
      p_investment_id: inv.id,
      p_contract: contract,
      p_token_amount: Math.round(Number(inv.amount_chf)),
      p_tx_hash: txHash,
      p_actor: ctx.actor,
    });
    if (error) {
      console.error('[admin/token/mint] confirm:', error.message);
      return NextResponse.json({ error: 'server', message: error.message, txHash }, { status: 500 });
    }
    return NextResponse.json({ success: true, txHash });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown';
    console.error('[admin/token/mint]', message);
    const code = /insufficient funds/i.test(message) ? 'insufficient_funds' : 'chain';
    return NextResponse.json({ error: code, message: message.slice(0, 200) }, { status: 502 });
  }
}
