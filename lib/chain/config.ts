import { defineChain } from 'viem';
import { polygon, polygonAmoy, hardhat } from 'viem/chains';

/** Zielkette: Polygon Amoy (Testnet, 80002), Polygon Mainnet (137) oder Hardhat (31337) für lokale Tests. Umschaltung nur über Umgebungsvariablen. */
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 80002);
export const EXPLORER_URL = (process.env.NEXT_PUBLIC_EXPLORER_URL ?? 'https://amoy.polygonscan.com').replace(/\/$/, '');

export function getChain() {
  if (CHAIN_ID === hardhat.id) return hardhat;
  if (CHAIN_ID === polygonAmoy.id) return polygonAmoy;
  if (CHAIN_ID === polygon.id) return polygon;
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
