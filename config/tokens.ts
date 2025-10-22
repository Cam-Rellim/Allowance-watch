export type TokenInfo = {
  address: `0x${string}`;
  symbol: string;
  decimals: number;
};

/**
 * Minimal but high-signal token sets per chain.
 * (We can grow these later or make them editable.)
 */
export const TOKENS_BY_CHAIN: Record<number, TokenInfo[]> = {
  // Ethereum mainnet (1)
  1: [
    { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6 },
    { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', decimals: 6 },
    { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI',  decimals: 18 },
    { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', decimals: 18 },
    { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', decimals: 8 },
  ],

  // Base (8453)
  8453: [
    { address: '0x833589fCD6eDb6E08f4c7C32D4f71B54B68f83F', symbol: 'USDC', decimals: 6 },
    { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', decimals: 18 },
  ],

  // Arbitrum (42161)
  42161: [
    { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', symbol: 'USDC', decimals: 6 },
    { address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', symbol: 'USDT', decimals: 6 },
    { address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', symbol: 'DAI',  decimals: 18 },
    { address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', symbol: 'WETH', decimals: 18 },
  ],

  // BNB Smart Chain (56)
  56: [
    { address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', symbol: 'USDC',  decimals: 18 },
    { address: '0x55d398326f99059ff775485246999027b3197955', symbol: 'USDT',  decimals: 18 },
    { address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', symbol: 'DAI',   decimals: 18 },
    { address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', symbol: 'WBNB', decimals: 18 },
  ],

  // Avalanche C-Chain (43114)
  43114: [
    { address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', symbol: 'USDC',  decimals: 6 },
    { address: '0x9702230A8ea53601f5Cd2dc00fDBc13d4dF4A8c7', symbol: 'USDT',  decimals: 6 },
    { address: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70', symbol: 'DAI',   decimals: 18 },
    { address: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB', symbol: 'WETH.e',decimals: 18 },
    { address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', symbol: 'WAVAX', decimals: 18 },
  ],

  // Polygon (137) — NEW
  137: [
    { address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359', symbol: 'USDC',  decimals: 6 },  // native
    { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC.e',decimals: 6 },  // bridged
    { address: '0xC2132D05D31c914a87C6611C10748AaCb04B58e8', symbol: 'USDT',  decimals: 6 },
    { address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', symbol: 'DAI',   decimals: 18 },
    { address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', symbol: 'WETH',  decimals: 18 },
  ],

  // Optimism (10) — NEW
  10: [
    { address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', symbol: 'USDC',  decimals: 6 },  // native
    { address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', symbol: 'USDC.e',decimals: 6 },  // bridged
    { address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', symbol: 'USDT',  decimals: 6 },
    { address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', symbol: 'DAI',   decimals: 18 },
    { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH',  decimals: 18 },
  ],
};
