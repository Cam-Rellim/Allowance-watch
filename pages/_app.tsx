import type { AppProps } from 'next/app';
import Head from 'next/head';
import React from 'react';

import { WagmiProvider, http, createConfig } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected } from 'wagmi/connectors';

import '../Styles/home.css';

const queryClient = new QueryClient();
const rpc = process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || 'https://eth.llamarpc.com';

const config = createConfig({
  chains: [mainnet],
  transports: { [mainnet.id]: http(rpc) },
  connectors: [injected()],
  ssr: true,
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      {/* Set initial theme before paint to reduce flash */}
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
              var pref = localStorage.getItem('theme')||'system';
              var dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
              var theme = pref==='system' ? (dark?'dark':'light') : pref;
              document.documentElement.setAttribute('data-theme', theme);
            }catch(e){}})();`,
          }}
        />
      </Head>

      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <Component {...pageProps} />
        </QueryClientProvider>
      </WagmiProvider>
    </>
  );
}
