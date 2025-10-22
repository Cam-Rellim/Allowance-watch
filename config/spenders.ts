export type SpenderInfo = { address: `0x${string}`; label: string };

/**
 * Known router/aggregator spenders to check for allowances.
 * (We expand this list over time; it's intentionally conservative.)
 */
export const SPENDERS_BY_CHAIN: Record<number, SpenderInfo[]> = {
  // Ethereum mainnet (1)
  1: [
    { address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', label: 'Uniswap V2 Router' },
    { address: '0xE592427A0AEce92De3Edee1F18E0157C05861564', label: 'Uniswap V3 Router' },
    { address: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', label: 'Uniswap SwapRouter02' },
    { address: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F', label: 'Sushi V2 Router' },
    { address: '0x1111111254EEB25477B68fb85Ed929f73A960582', label: '1inch Router' },
  ],

  // Base (8453)
  8453: [
    { address: '0xE592427A0AEce92De3Edee1F18E0157C05861564', label: 'Uniswap V3 Router' },
    { address: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', label: 'Uniswap SwapRouter02' },
  ],

  // Arbitrum (42161)
  42161: [
    { address: '0xE592427A0AEce92De3Edee1F18E0157C05861564', label: 'Uniswap V3 Router' },
    { address: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', label: 'Uniswap SwapRouter02' },
    { address: '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506', label: 'Sushi V2 Router' },
  ],

  // BNB Smart Chain (56)
  56: [
    { address: '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506', label: 'Sushi V2 Router' },
    { address: '0x1111111254EEB25477B68fb85Ed929f73A960582', label: '1inch Router' },
  ],

  // Avalanche C-Chain (43114)
  43114: [
    { address: '0x60aE616a2155Ee3d9A68541Ba4544862310933d4', label: 'Trader Joe Router' },
    { address: '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506', label: 'Sushi V2 Router' },
  ],

  // Polygon (137) — NEW
  137: [
    { address: '0xa5E0829aF0Bf49E3b2926422aDc6c52F7aAeB9d1', label: 'QuickSwap V2 Router' },
    { address: '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506', label: 'Sushi V2 Router' },
    { address: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', label: 'Uniswap SwapRouter02' },
  ],

  // Optimism (10) — NEW
  10: [
    { address: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', label: 'Uniswap SwapRouter02' },
    { address: '0x2abf46987dd628b6f4602d3dc68d93a2e02ee9ba', label: 'Sushi V2 Router' },
  ],
};
