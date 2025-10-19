import { mainnet, base, arbitrum, bsc, avalanche } from 'viem/chains';
import type { Chain } from 'viem';

export const CHAINS: Chain[] = [base, arbitrum, bsc, avalanche, mainnet];

export const CHAIN_BY_ID: Record<number, Chain> = {
  [mainnet.id]: mainnet,
  [base.id]: base,
  [arbitrum.id]: arbitrum,
  [bsc.id]: bsc,
  [avalanche.id]: avalanche,
};

export const DEFAULT_CHAIN_ID = base.id; // default to Base
