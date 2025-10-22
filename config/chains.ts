import type { Chain } from 'viem';
import {
  mainnet,
  base,
  arbitrum,
  bsc,
  avalanche,
  polygon,
  optimism,
} from 'viem/chains';

/**
 * Chains the UI can scan. Order controls the dropdown order.
 */
export const CHAINS: Chain[] = [
  base,
  arbitrum,
  bsc,
  avalanche,
  polygon,   // NEW
  optimism,  // NEW
  mainnet,
];

/** Quick lookup by id */
export const CHAIN_BY_ID: Record<number, Chain> = Object.fromEntries(
  CHAINS.map((c) => [c.id, c]),
) as Record<number, Chain>;

/** Per-chain RPCs (read from env). If undefined, app falls back to public RPC with a warning. */
export const RPC_URL_FOR_CHAIN: Record<number, string | undefined> = {
  1: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL,
  8453: process.env.NEXT_PUBLIC_BASE_RPC_URL,
  42161: process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL,
  56: process.env.NEXT_PUBLIC_BSC_RPC_URL,
  43114: process.env.NEXT_PUBLIC_AVALANCHE_RPC_URL,
  137: process.env.NEXT_PUBLIC_POLYGON_RPC_URL,   // NEW
  10: process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL,  // NEW
};
