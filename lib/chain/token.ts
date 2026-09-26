import 'server-only';
import {
  createPublicClient,
  createWalletClient,
  http,
  getAddress,
  isAddress,
  type Address,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import artifact from './LiquodaProjectToken.json';
import { CHAIN_ID, getChain } from './config';

/**
 * Backend-Zugriff auf den Projekt-Token (Spec, Abschnitt 8).
 * Das Backend-Konto hält die Rollen Owner/Minter/Pauser/Allowlist.
 * LIQUODA hält zu keinem Zeitpunkt Token: Mint geht direkt in die Wallet des Investors.
 */

export const TOKEN_ABI = artifact.abi;

export function hasChainEnv(): boolean {
  return !!(process.env.POLYGON_RPC_URL && process.env.DEPLOYER_PRIVATE_KEY);
}

function clients() {
  const rpc = process.env.POLYGON_RPC_URL;
  const pk = process.env.DEPLOYER_PRIVATE_KEY as Hex | undefined;
  if (!rpc || !pk) throw new Error('POLYGON_RPC_URL und DEPLOYER_PRIVATE_KEY müssen gesetzt sein.');
  const chain = getChain();
  const account = privateKeyToAccount(pk);
  const publicClient = createPublicClient({ chain, transport: http(rpc) });
  const walletClient = createWalletClient({ chain, transport: http(rpc), account });
  return { publicClient, walletClient, account };
}

export function backendAddress(): Address | null {
  const pk = process.env.DEPLOYER_PRIVATE_KEY as Hex | undefined;
  return pk ? privateKeyToAccount(pk).address : null;
}

export async function backendBalanceWei(): Promise<bigint> {
  const { publicClient, account } = clients();
  return publicClient.getBalance({ address: account.address });
}

/** Vertrag für ein Projekt anlegen. Cap = Zielbetrag (1 Token = CHF 1). */
export async function deployProjectToken(params: {
  name: string;
  symbol: string;
  capChf: number;
  projectRef: string;
}): Promise<{ address: Address; txHash: Hex; chainId: number }> {
  const { publicClient, walletClient, account } = clients();
  const txHash = await walletClient.deployContract({
    abi: TOKEN_ABI,
    bytecode: artifact.bytecode as Hex,
    args: [params.name, params.symbol, BigInt(Math.round(params.capChf)), params.projectRef, account.address],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  if (receipt.status !== 'success' || !receipt.contractAddress) {
    throw new Error('Deployment fehlgeschlagen');
  }
  return { address: getAddress(receipt.contractAddress), txHash, chainId: CHAIN_ID };
}

export async function isAllowed(contract: Address, wallet: Address): Promise<boolean> {
  const { publicClient } = clients();
  return publicClient.readContract({ address: contract, abi: TOKEN_ABI, functionName: 'isAllowed', args: [wallet] }) as Promise<boolean>;
}

export async function setAllowed(contract: Address, wallet: Address): Promise<Hex> {
  const { publicClient, walletClient } = clients();
  const hash = await walletClient.writeContract({ address: contract, abi: TOKEN_ABI, functionName: 'setAllowed', args: [wallet, true] });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

/** Mint in die Wallet des Investors; Betrag in CHF = Token-Menge. */
export async function mintTokens(contract: Address, wallet: Address, amountChf: number, investmentRef: string): Promise<Hex> {
  const { publicClient, walletClient } = clients();
  const hash = await walletClient.writeContract({
    address: contract,
    abi: TOKEN_ABI,
    functionName: 'mint',
    args: [wallet, BigInt(Math.round(amountChf)), investmentRef],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== 'success') throw new Error('Mint fehlgeschlagen');
  return hash;
}

/** SHA-256 eines Dokuments (hex, 64 Zeichen) on-chain verankern. */
export async function registerDocumentHash(contract: Address, sha256Hex: string, label: string): Promise<Hex> {
  const { publicClient, walletClient } = clients();
  const hash = await walletClient.writeContract({
    address: contract,
    abi: TOKEN_ABI,
    functionName: 'registerDocument',
    args: [`0x${sha256Hex}` as Hex, label],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function tokenBalance(contract: Address, wallet: Address): Promise<bigint> {
  const { publicClient } = clients();
  return publicClient.readContract({ address: contract, abi: TOKEN_ABI, functionName: 'balanceOf', args: [wallet] }) as Promise<bigint>;
}

export function normalizeAddress(value: unknown): Address | null {
  return typeof value === 'string' && isAddress(value) ? getAddress(value) : null;
}
