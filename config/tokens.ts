import { mainnet, base, arbitrum, bsc, avalanche } from 'viem/chains';

export const TOKENS_BY_CHAIN: Record<number, { symbol: string; address: string }[]> = {
  [mainnet.id]: [
    { symbol: 'USDC', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
    { symbol: 'USDT', address: '0xdac17f958d2ee523a2206206994597c13d831ec7' },
    { symbol: 'DAI', address: '0x6b175474e89094c44da98b954eedeac495271d0f' },
    { symbol: 'WETH', address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' },
    { symbol: 'WBTC', address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599' },
  ],
  [base.id]: [
    { symbol: 'USDC', address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' },
    { symbol: 'DAI', address: '0x50c5725949a6f0c72e6c4a641f24049a917db0cb' },
    { symbol: 'WETH', address: '0x4200000000000000000000000000000000000006' },
  ],
  [arbitrum.id]: [
    { symbol: 'USDC', address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831' },
    { symbol: 'USDT', address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9' },
    { symbol: 'DAI', address: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1' },
    { symbol: 'WETH', address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1' },
  ],
  [bsc.id]: [
    { symbol: 'USDC', address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d' },
    { symbol: 'USDT', address: '0x55d398326f99059ff775485246999027b3197955' },
    { symbol: 'DAI', address: '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3' },
    { symbol: 'WBNB', address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c' },
  ],
  [avalanche.id]: [
    { symbol: 'USDC', address: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e' },
    { symbol: 'USDT', address: '0x9702230a8ea53601f5cd2dc00fdbb880a4059836' },
    { symbol: 'DAI', address: '0xd586e7f844cea2f87f50152665bcbc2c279d8d70' },
    { symbol: 'WAVAX', address: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7' },
  ],
};
