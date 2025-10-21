// pages/_app.tsx
import type { AppProps } from 'next/app';

// NOTE: matches your repo's folder name (capital S)
import '../Styles/home.css';

import { WagmiProvider, http, createConfig } from 'wagmi';
import { mainnet, base, arbitrum, bsc, avalanche } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected } from 'wagmi/connectors';

const queryClient = new QueryClient();

const rpcById: Record<number, string> = {
  [mainnet.id]: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
  [base.id]: process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org',
  [arbitrum.id]: process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
  [bsc.id]: process.env.NEXT_PUBLIC_BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
  [avalanche.id]: process.env.NEXT_PUBLIC_AVALANCHE_RPC_URL || 'https://api.avax.network/ext/bc/C/rpc',
};

const chains = [mainnet, base, arbitrum, bsc, avalanche] as const;

const config = createConfig({
  chains,
  transports: Object.fromEntries(chains.map((c) => [c.id, http(rpcById[c.id])])) as any,
  connectors: [injected()],
  ssr: true,
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
