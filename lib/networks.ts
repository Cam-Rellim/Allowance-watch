import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

export const chains = {
  ethereum: mainnet
} as const;

export type SupportedChainKey = keyof typeof chains;

export function getPublicClient(chain: SupportedChainKey = 'ethereum') {
  const rpc = process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL;
  if (!rpc) {
    console.warn('NEXT_PUBLIC_ETHEREUM_RPC_URL not set. Using default public RPC which may be unreliable.');
  }
  return createPublicClient({
    chain: chains[chain],
    transport: http(rpc || 'https://eth.llamarpc.com')
  });
}
