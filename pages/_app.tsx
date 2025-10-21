// pages/_app.tsx
import type { AppProps } from 'next/app';

import '../styles/home.css'; // <- global styles (make sure styles/home.css exists)

import { WagmiProvider, http, createConfig } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected } from 'wagmi/connectors';

const queryClient = new QueryClient();

// Only wiring mainnet here is fine for now because our scanners use viem directly.
// We can expand Wagmi chains later when we add wallet connect or onchain tx actions.
const rpc = process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || 'https://eth.llamarpc.com';

const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(rpc),
  },
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
