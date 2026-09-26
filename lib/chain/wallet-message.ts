/** Text, den der Investor zur Verknüpfung seiner Wallet signiert (kein Gas, keine Transaktion). */
export function walletLinkMessage(params: { address: string; nonce: string; email: string }): string {
  return [
    'LIQUODA – Wallet verknüpfen / Link wallet',
    '',
    `Konto / Account: ${params.email}`,
    `Wallet: ${params.address}`,
    `Nonce: ${params.nonce}`,
    '',
    'Mit dieser Signatur bestätigen Sie, dass Sie diese Wallet kontrollieren. Es entsteht keine Transaktion und keine Verpflichtung.',
    'By signing you confirm control of this wallet. No transaction and no obligation results.',
  ].join('\n');
}
