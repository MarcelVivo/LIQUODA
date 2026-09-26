import 'server-only';
import {
  createPublicClient,
  createWalletClient,
  http,
  getAddress,
  isAddress,
  type Account,
  type Address,
  type Chain,
  type Hex,
  type PublicClient,
  type Transport,
  type WalletClient,
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
  const privyWallet = !!(process.env.PRIVY_WALLET_ID && process.env.PRIVY_WALLET_ADDRESS && process.env.PRIVY_APP_SECRET);
  return !!process.env.POLYGON_RPC_URL && (privyWallet || !!process.env.DEPLOYER_PRIVATE_KEY);
}

type Clients = {
  publicClient: PublicClient<Transport, Chain>;
  walletClient: WalletClient<Transport, Chain, Account>;
  address: Address;
};

let cached: Promise<Clients> | null = null;

/**
 * Signierendes Konto des Backends. Bevorzugt die Privy-Server-Wallet (Schlüssel in
 * geschützter Hardware bei Privy, nie im Code oder in Umgebungsvariablen). Fallback
 * für lokale Tests: DEPLOYER_PRIVATE_KEY (z. B. Hardhat-Konto).
 */
async function buildClients(): Promise<Clients> {
  const rpc = process.env.POLYGON_RPC_URL;
  if (!rpc) throw new Error('POLYGON_RPC_URL muss gesetzt sein.');
  const chain = getChain();
  const transport = http(rpc);

  const walletId = process.env.PRIVY_WALLET_ID;
  const walletAddress = process.env.PRIVY_WALLET_ADDRESS as Address | undefined;
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;

  if (walletId && walletAddress && appId && appSecret) {
    const { PrivyClient } = await import('@privy-io/server-auth');
    const { createViemAccount } = await import('@privy-io/server-auth/viem');
    const privy = new PrivyClient(appId, appSecret);
    // Cast: das Privy-Paket liefert für den viem-Unterpfad eine eigene, gleichnamige Typdeklaration
    const account = await createViemAccount({ walletId, address: walletAddress, privy: privy as unknown as Parameters<typeof createViemAccount>[0]['privy'] });
    return {
      publicClient: createPublicClient({ chain, transport }),
      walletClient: createWalletClient({ chain, transport, account }),
      address: account.address,
    };
  }

  const pk = process.env.DEPLOYER_PRIVATE_KEY as Hex | undefined;
  if (!pk) throw new Error('PRIVY_WALLET_ID/PRIVY_WALLET_ADDRESS oder DEPLOYER_PRIVATE_KEY müssen gesetzt sein.');
  const account = privateKeyToAccount(pk);
  return {
    publicClient: createPublicClient({ chain, transport }),
    walletClient: createWalletClient({ chain, transport, account }),
    address: account.address,
  };
}

function clients(): Promise<Clients> {
  if (!cached) cached = buildClients().catch((err) => { cached = null; throw err; });
  return cached;
}

export function backendAddress(): Address | null {
  const privyAddress = process.env.PRIVY_WALLET_ADDRESS as Address | undefined;
  if (privyAddress) return privyAddress;
  const pk = process.env.DEPLOYER_PRIVATE_KEY as Hex | undefined;
  return pk ? privateKeyToAccount(pk).address : null;
}

export async function backendBalanceWei(): Promise<bigint> {
  const { publicClient, address } = await clients();
  return publicClient.getBalance({ address });
}

/** Vertrag für ein Projekt anlegen. Cap = Zielbetrag (1 Token = CHF 1). */
export async function deployProjectToken(params: {
  name: string;
  symbol: string;
  capChf: number;
  projectRef: string;
}): Promise<{ address: Address; txHash: Hex; chainId: number }> {
  const { publicClient, walletClient, address } = await clients();
  const txHash = await walletClient.deployContract({
    abi: TOKEN_ABI,
    bytecode: artifact.bytecode as Hex,
    args: [params.name, params.symbol, BigInt(Math.round(params.capChf)), params.projectRef, address],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  if (receipt.status !== 'success' || !receipt.contractAddress) {
    throw new Error('Deployment fehlgeschlagen');
  }
  return { address: getAddress(receipt.contractAddress), txHash, chainId: CHAIN_ID };
}

export async function isAllowed(contract: Address, wallet: Address): Promise<boolean> {
  const { publicClient } = await clients();
  return publicClient.readContract({ address: contract, abi: TOKEN_ABI, functionName: 'isAllowed', args: [wallet] }) as Promise<boolean>;
}

export async function setAllowed(contract: Address, wallet: Address): Promise<Hex> {
  const { publicClient, walletClient } = await clients();
  const hash = await walletClient.writeContract({ address: contract, abi: TOKEN_ABI, functionName: 'setAllowed', args: [wallet, true] });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

/** Mint in die Wallet des Investors; Betrag in CHF = Token-Menge. */
export async function mintTokens(contract: Address, wallet: Address, amountChf: number, investmentRef: string): Promise<Hex> {
  const { publicClient, walletClient } = await clients();
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
  const { publicClient, walletClient } = await clients();
  const hash = await walletClient.writeContract({
    address: contract,
    abi: TOKEN_ABI,
    functionName: 'registerDocument',
    args: [`0x${sha256Hex}` as Hex, label],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

/** Register pausieren (keine Mints, keine Transfers), z. B. nach Rückabwicklung. Idempotent. */
export async function pauseToken(contract: Address): Promise<Hex | null> {
  const { publicClient, walletClient } = await clients();
  const paused = (await publicClient.readContract({ address: contract, abi: TOKEN_ABI, functionName: 'paused' })) as boolean;
  if (paused) return null;
  const hash = await walletClient.writeContract({ address: contract, abi: TOKEN_ABI, functionName: 'pause' });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function tokenBalance(contract: Address, wallet: Address): Promise<bigint> {
  const { publicClient } = await clients();
  return publicClient.readContract({ address: contract, abi: TOKEN_ABI, functionName: 'balanceOf', args: [wallet] }) as Promise<bigint>;
}

export function normalizeAddress(value: unknown): Address | null {
  return typeof value === 'string' && isAddress(value) ? getAddress(value) : null;
}
