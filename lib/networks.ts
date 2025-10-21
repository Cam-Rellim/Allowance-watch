// lib/networks.ts
import { createPublicClient, fallback, http } from 'viem';
import { CHAINS } from '../config/chains';

// Primary RPCs from env; public fallbacks as a backup.
// You already set most envs in Vercel – these just add a second option.
const RPCS: Record<number, string[]> = {
  // Ethereum
  1: [
    process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
    'https://rpc.ankr.com/eth',
  ],
  // Base
  8453: [
    process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org',
    'https://base.publicnode.com',
  ],
  // Arbitrum One
  42161: [
    process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    'https://arbitrum-one.publicnode.com',
  ],
  // BNB Chain
  56: [
    process.env.NEXT_PUBLIC_BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
    'https://bsc.publicnode.com',
  ],
  // Avalanche C-Chain
  43114: [
    process.env.NEXT_PUBLIC_AVALANCHE_RPC_URL || 'https://api.avax.network/ext/bc/C/rpc',
    'https://avalanche-c-chain.publicnode.com',
  ],
};

function buildTransport(chainId: number) {
  const urls = RPCS[chainId] || [];
  const transports = urls.map((u) => http(u, { timeout: 12_000 }));
  // fallback(): tries all, rotates on failure; retryCount handles 429/temporary issues.
  return fallback(transports, {
    rank: false,      // don’t penalize slower nodes (just try in parallel)
    retryCount: 2,    // quick, gentle retry
    retryDelay: 600,  // ~0.6s between retries
  });
}

type Client = ReturnType<typeof createPublicClient>;
const clients: Record<number, Client> = {};

// Public client for read-only calls (multicall, ENS, etc.)
export function getPublicClient(chainId: number) {
  if (!clients[chainId]) {
    const chain = CHAINS.find((c) => c.id === chainId);
    if (!chain) throw new Error(`Unknown chain ${chainId}`);
    clients[chainId] = createPublicClient({
      chain,
      transport: buildTransport(chainId),
    });
  }
  return clients[chainId];
}
