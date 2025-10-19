// === Verify each from official docs before production! ===
export const SPENDERS = [
  { name: 'UniswapV2Router02', address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D' },
  { name: 'SushiSwapRouter',    address: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F' }
  // Add more (Uniswap Universal Router, 1inch, OpenSea Seaport) after verifying.
] as const;
