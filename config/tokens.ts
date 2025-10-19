// Tokens to check per chain (start small: USDC + wrapped native)
export type Token = { symbol: string; address: `0x${string}` };

export const TOKENS_BY_CHAIN: Record<number, Token[]> = {
  // Ethereum
  1: [
    // USDC (Circle)
    { symbol: "USDC", address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" },
    // WETH (Uniswap docs)
    { symbol: "WETH", address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" },
  ],
  // Base
  8453: [
    // USDC (Circle)
    { symbol: "USDC", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" },
    // WETH (Uniswap docs)
    { symbol: "WETH", address: "0x4200000000000000000000000000000000000006" },
  ],
  // Arbitrum
  42161: [
    // Native USDC (Circle)
    { symbol: "USDC", address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" },
    // WETH (Uniswap docs)
    { symbol: "WETH", address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1" },
  ],
  // BNB Smart Chain
  56: [
    // Binance-Peg USDC (BSCScan)
    { symbol: "USDC", address: "0x8AC76a51cc950d9822D68b83FE1Ad97B32Cd580d" },
    // WBNB (Uniswap docs “Wrapped Native”)
    { symbol: "WBNB", address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" },
  ],
  // Avalanche C-Chain
  43114: [
    // USDC (Circle / Snowtrace)
    { symbol: "USDC", address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E" },
    // WAVAX (Uniswap docs “Wrapped Native”)
    { symbol: "WAVAX", address: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7" },
  ],
};