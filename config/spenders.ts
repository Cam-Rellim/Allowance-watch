export type Spender = { label: string; address: `0x${string}` };

export const SPENDERS_BY_CHAIN: Record<number, Spender[]> = {
  // Ethereum
  1: [
    { label: "Uniswap SwapRouter02", address: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45" },
    { label: "Uniswap UniversalRouter", address: "0x66a9893cc07d91d95644aedd05d03f95e1dba8af" },
    { label: "Uniswap Permit2", address: "0x000000000022D473030F116dDEE9F6B43aC78BA3" },
  ],
  // Base
  8453: [
    { label: "Uniswap SwapRouter02", address: "0x2626664c2603336E57B271c5C0b26F421741e481" },
    { label: "Uniswap UniversalRouter", address: "0x6ff5693b99212da76ad316178a184ab56d299b43" },
    { label: "Uniswap Permit2", address: "0x000000000022D473030F116dDEE9F6B43aC78BA3" },
  ],
  // Arbitrum
  42161: [
    { label: "Uniswap SwapRouter02", address: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45" },
    { label: "Uniswap UniversalRouter", address: "0xa51afafe0263b40edaef0df8781ea9aa03e381a3" },
    { label: "Uniswap Permit2", address: "0x000000000022D473030F116dDEE9F6B43aC78BA3" },
  ],
  // BNB Chain
  56: [
    { label: "Uniswap SwapRouter02", address: "0xB971eF87ede563556b2ED4b1C0b0019111Dd85d2" },
    { label: "Uniswap UniversalRouter", address: "0x1906c1d672b88cd1b9ac7593301ca990f94eae07" },
    { label: "Uniswap Permit2", address: "0x000000000022D473030F116dDEE9F6B43aC78BA3" },
  ],
  // Avalanche C-Chain
  43114: [
    { label: "Uniswap SwapRouter02", address: "0xbb00FF08d01D300023C629E8fFfFcb65A5a578cE" },
    { label: "Uniswap UniversalRouter", address: "0x94b75331ae8d42c1b61065089b7d48fe14aa73b7" },
    { label: "Uniswap Permit2", address: "0x000000000022D473030F116dDEE9F6B43aC78BA3" },
  ],
};