import { mainnet, base, arbitrum, bsc, avalanche } from 'viem/chains';

export const SPENDERS_BY_CHAIN: Record<number, { label: string; address: string }[]> = {
  [mainnet.id]: [
    { label: 'Uniswap V2 Router', address: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d' },
    { label: 'Uniswap V3 Router', address: '0xe592427a0aece92de3edee1f18e0157c05861564' },
    { label: '1inch Router', address: '0x1111111254fb6c44bac0bed2854e76f90643097d' },
  ],
  [base.id]: [
    { label: 'BaseSwap Router', address: '0x2ad95483ac838e2884563ed7e0d5f26de12ec958' },
    { label: 'Aerodrome Router', address: '0xc4ce313d3d1585f4b9a72d7688e104bb9f8f4f9d' },
  ],
  [arbitrum.id]: [
    { label: 'Uniswap V3 Router', address: '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45' },
    { label: 'Camelot Router', address: '0xc873fecbd354f5a56e00e710b90ef4201db2448d' },
  ],
  [bsc.id]: [
    { label: 'PancakeSwap Router', address: '0x10ed43c718714eb63d5aa57b78b54704e256024e' },
    { label: 'ApeSwap Router', address: '0xc0788a3ad43d79aa53b09c2eacc313a787d1d607' },
  ],
  [avalanche.id]: [
    { label: 'Trader Joe Router', address: '0x60ae616a2155ee3d9a68541ba4544862310933d4' },
    { label: 'Pangolin Router', address: '0x9bc7d17df7f7b8bba97cc5a7b10ffb3a5f8f6b4e' },
  ],
};
