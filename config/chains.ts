// Minimal list of supported chains
import { mainnet, base, arbitrum, bsc, avalanche } from "viem/chains";

export const CHAINS = [mainnet, base, arbitrum, bsc, avalanche];

export const CHAIN_BY_ID: Record<number, typeof mainnet> = {
  [mainnet.id]: mainnet,
  [base.id]: base,
  [arbitrum.id]: arbitrum,
  [bsc.id]: bsc,
  [avalanche.id]: avalanche,
};

export const DEFAULT_CHAIN_ID = mainnet.id;