import { createPublicClient, http } from 'viem';
import { CHAIN_BY_ID } from '../config/chains';

function rpcFor(chainId: number): string {
  switch (chainId) {
    case 1:
      return process.env.NEXT_PUBLIC_RPC_MAINNET
        ?? process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL
        ?? 'https://cloudflare-eth.com';
    case 8453:
      return process.env.NEXT_PUBLIC_RPC_BASE ?? 'https://mainnet.base.org';
    case 42161:
      return process.env.NEXT_PUBLIC_RPC_ARBITRUM ?? 'https://arb1.arbitrum.io/rpc';
    case 56:
      return process.env.NEXT_PUBLIC_RPC_BSC ?? 'https://bsc-dataseed.binance.org';
    case 43114:
      return process.env.NEXT_PUBLIC_RPC_AVALANCHE ?? 'https://api.avax.network/ext/bc/C/rpc';
    default:
      throw new Error(`Unsupported chain ${chainId}`);
  }
}

export function getPublicClient(chainId: number) {
  const chain = CHAIN_BY_ID[chainId];
  const url = rpcFor(chainId);
  return createPublicClient({ chain, transport: http(url) });
}
