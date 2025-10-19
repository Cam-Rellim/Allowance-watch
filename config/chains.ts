import { mainnet, base, arbitrum, bsc, avalanche } from 'viem/chains';

export const CHAINS = [base, arbitrum, bsc, avalanche, mainnet]; // prioritize L2s/alt L1s

export const CHAIN_BY_ID: Record<number, typeof mainnet> = {
  [mainnet.id]: mainnet,
  [base.id]: base,
  [arbitrum.id]: arbitrum,
  [bsc.id]: bsc,
  [avalanche.id]: avalanche,
};

export const DEFAULT_CHAIN_ID = base.id; // default to Base
