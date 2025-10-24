import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import { isAddress, getAddress, formatUnits, maxUint256 } from 'viem';
import { useAccount } from 'wagmi';

import ConnectButton from '../components/ConnectButton';
import Brand from '../components/Brand';
import SummaryBar from '../components/SummaryBar';
import Results from '../components/Results';
import type { Finding } from '../components/Results';

import { getPublicClient } from '../lib/networks';
import { ERC20_ABI } from '../lib/erc20';
import { CHAINS } from '../config/chains';
import { TOKENS_BY_CHAIN } from '../config/tokens';
import { SPENDERS_BY_CHAIN } from '../config/spenders';

type ChainListItem = { id: number; name: string };

function prettyAmount(raw: string) {
  // Raw is a decimal string from formatUnits
  const n = Number(raw);
  if (!isFinite(n)) return raw;
  // Limit decimals for readability
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: n < 1 ? 6 : n < 100 ? 4 : 2,
  }).format(n);
}

export default function Home() {
  const { address: connectedAddress } = useAccount();

  const [input, setInput] = useState<string>('');
  const [selectedChainId, setSelectedChainId] = useState<number>(0); // 0 = All
  const [loading, setLoading] = useState(false);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Build a user-friendly chain list from your CHAINS map
  const chainsList: ChainListItem[] = useMemo(() => {
    const items: ChainListItem[] = Object.entries(CHAINS).map(([k, v]) => {
      const name = (v as any)?.name ?? `Chain ${k}`;
      return { id: Number(k), name };
    });
    // sort by name asc, put mainnet first if present
    items.sort((a, b) => a.name.localeCompare(b.name));
    return items;
  }, []);

  const ownerInput = (input || connectedAddress || '').trim();

  async function scan() {
    setError(null);
    setFindings([]);
    if (!ownerInput) {
      setError('Enter a wallet address or connect a wallet.');
      return;
    }
    if (!isAddress(ownerInput)) {
      setError('That does not look like a valid EVM address.');
      return;
    }

    const owner = getAddress(ownerInput) as `0x${string}`;
    const chainIds =
      selectedChainId === 0
        ? (Object.keys(CHAINS).map((k) => Number(k)) as number[])
        : [selectedChainId];

    setLoading(true);

    try {
      const all: Finding[] = [];

      for (const cid of chainIds) {
        const chainCfg = (CHAINS as any)[cid];
        if (!chainCfg) continue;

        const chainName: string = chainCfg.name ?? `Chain ${cid}`;
        const client = getPublicClient(cid);

        const tokens: Array<{ address: `0x${string}`; symbol: string; decimals: number }> =
          (TOKENS_BY_CHAIN as any)[cid] ?? [];
        const spenders: Array<{ address: `0x${string}`; name?: string }> =
          (SPENDERS_BY_CHAIN as any)[cid] ?? [];

        if (!tokens.length || !spenders.length) {
          // No config for this chain; skip silently (or set a soft note).
          continue;
        }

        // Build multicall set: for each token x spender: allowance(owner, spender)
        const calls = [];
        for (const t of tokens) {
          for (const s of spenders) {
            calls.push({
              address: t.address,
              abi: ERC20_ABI,
              functionName: 'allowance' as const,
              args: [owner, s.address],
            });
          }
        }

        // Fallback: if client.multicall not available in your wrapper, sequentially read
        let results: Array<{ result?: bigint | null }> = [];
        if (typeof (client as any).multicall === 'function') {
          const mc = await (client as any).multicall({ contracts: calls });
          results = mc as Array<{ result?: bigint | null }>;
        } else {
          for (const c of calls) {
            try {
              const r = await (client as any).readContract(c);
              results.push({ result: r as bigint });
            } catch {
              results.push({ result: null });
            }
          }
        }

        // Map back results
        let idx = 0;
        for (const t of tokens) {
          for (const s of spenders) {
            const r = results[idx++]?.result ?? 0n;
            if (r > 0n) {
              const pretty =
                r === maxUint256
                  ? 'Unlimited'
                  : `${prettyAmount(formatUnits(r, t.decimals))} ${t.symbol}`;

              all.push({
                chainId: cid,
                chain: chainName,
                token: t.symbol,
                tokenAddress: t.address,
                spender: s.address,
                spenderName: s.name,
                allowance: pretty,
              });
            }
          }
        }
      }

      // Sort by chain then token for stability
      all.sort((a, b) => (a.chain === b.chain ? a.token.localeCompare(b.token) : a.chain.localeCompare(b.chain)));
      setFindings(all);
    } catch (e: any) {
      setError(e?.message || 'Scan failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Allowance Watch</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="wrap">
        {/* Header */}
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <Brand subtitle="Allowance Watch" />
          <ConnectButton />
        </div>

        {/* Controls */}
        <div className="card" style={{ marginTop: 12 }}>
          <div className="row" style={{ gap: 12, alignItems: 'center' }}>
            <div className="col">
              <label className="label">Wallet Address</label>
              <input
                className="input"
                placeholder="0x… or connect"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                inputMode="text"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
              />
              <div className="hint">Connected: {connectedAddress ? getAddress(connectedAddress) : '—'}</div>
            </div>

            <div>
              <label className="label">Chain</label>
              <select
                className="select"
                value={selectedChainId}
                onChange={(e) => setSelectedChainId(Number(e.target.value))}
              >
                <option value={0}>All supported</option>
                {chainsList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ alignSelf: 'flex-end' }}>
              <button className="btn" onClick={scan} disabled={loading}>
                {loading ? 'Scanning…' : 'Scan'}
              </button>
            </div>
          </div>

          {error && (
            <div className="alert" role="alert" style={{ marginTop: 12 }}>
              {error}
            </div>
          )}
        </div>

        {/* Summary + Results */}
        <div style={{ marginTop: 14 }}>
          <SummaryBar findings={findings} loading={loading} />
          <Results findings={findings} />
        </div>
      </main>
    </>
  );
}
