import { defineChain } from 'viem';
import { polygonAmoy, hardhat } from 'viem/chains';

/** Zielkette: Polygon Amoy (Testnet). Für lokale Tests kann NEXT_PUBLIC_CHAIN_ID=31337 (Hardhat) gesetzt werden. */
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 80002);
export const EXPLORER_URL = (process.env.NEXT_PUBLIC_EXPLORER_URL ?? 'https://amoy.polygonscan.com').replace(/\/$/, '');

export function getChain() {
  if (CHAIN_ID === hardhat.id) return hardhat;
  if (CHAIN_ID === polygonAmoy.id) return polygonAmoy;
  return defineChain({ ...polygonAmoy, id: CHAIN_ID });
}

export function explorerAddress(address: string): string {
  return `${EXPLORER_URL}/address/${address}`;
}
export function explorerTx(hash: string): string {
  return `${EXPLORER_URL}/tx/${hash}`;
}
export function explorerToken(address: string): string {
  return `${EXPLORER_URL}/token/${address}`;
}
