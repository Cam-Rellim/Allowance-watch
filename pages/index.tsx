import Head from 'next/head';
import React, { useMemo, useState } from 'react';
import { isAddress, getAddress, type Address } from 'viem';
import { ERC20_ABI } from '../lib/erc20';
import { getPublicClient } from '../lib/networks';
import { CHAINS, DEFAULT_CHAIN_ID } from '../config/chains';
import { TOKENS_BY_CHAIN } from '../config/tokens';
import { SPENDERS_BY_CHAIN } from '../config/spenders';

import ConnectButton from '../components/ConnectButton';
import Brand from '../components/Brand';
import SaveAddressButton from '../components/SaveAddressButton';
import AddressBook from '../components/AddressBook';
import SummaryBar from '../components/SummaryBar';
import Results from '../components/Results';

import '../styles/home.css';

type ChainCfg = (typeof CHAINS)[keyof typeof CHAINS];
type Token = { address: Address; symbol: string; decimals: number };
type Spender = { address: Address; name: string };

type Finding = {
  chainId: number;
  chainName: string;
  token: Token;
  spender: Spender;
  allowancePretty: string;
  allowanceRaw: bigint;
  risk: 'high' | 'med' | 'low';
};

function prettyAmount(raw: bigint, decimals: number) {
  if (raw === 0n) return '0';
  const neg = raw < 0n ? '-' : '';
  const val = raw < 0n ? -raw : raw;
  const s = val.toString().padStart(decimals + 1, '0');
  const head = s.slice(0, -decimals);
  const tail = s.slice(-decimals).replace(/0+$/, '');
  return neg + (tail ? `${head}.${tail}` : head);
}

export default function Home() {
  // form state
  const [input, setInput] = useState('');
  const [scanAll, setScanAll] = useState(true);
  const [selectedChainId, setSelectedChainId] = useState<number>(DEFAULT_CHAIN_ID);

  // results
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const chainsList: ChainCfg[] = useMemo(
    () => Object.values(CHAINS).sort((a, b) => a.name.localeCompare(b.name)),
    []
  );

  async function normalizeToAddress(text: string): Promise<Address> {
    const t = text.trim();
    if (isAddress(t)) return getAddress(t);
    if (t.endsWith('.eth')) {
      // resolve ENS on mainnet
      const client = getPublicClient(1);
      const addr = await client.getEnsAddress({ name: t as any }).catch(() => null);
      if (addr && isAddress(addr)) return getAddress(addr);
    }
    throw new Error('Please enter a valid EVM address.');
  }

  function riskFrom(raw: bigint, decimals: number): 'high' | 'med' | 'low' {
    // simple heuristic
    const pretty = Number(prettyAmount(raw, decimals).split('.')[0] || '0');
    if (pretty >= 1_000_000) return 'high';
    if (pretty >= 10_000) return 'med';
    return 'low';
  }

  async function handleScan() {
    setErr(null);
    setFindings([]);
    const owner: Address = await normalizeToAddress(input).catch((e) => {
      setErr(e.message || String(e));
      throw e;
    });
    setLoading(true);
    try {
      const chainIds = scanAll ? Object.values(CHAINS).map((c) => c.id) : [selectedChainId];
      const all: Finding[] = [];

      for (const chainId of chainIds) {
        const cfg = Object.values(CHAINS).find((c) => c.id === chainId)!;
        const tokens = (TOKENS_BY_CHAIN as any)[chainId] as Token[] | undefined;
        const spenders = (SPENDERS_BY_CHAIN as any)[chainId] as Spender[] | undefined;
        if (!tokens?.length || !spenders?.length) continue;

        const client = getPublicClient(chainId);
        const contracts = [];
        for (const t of tokens) {
          for (const s of spenders) {
            contracts.push({
              abi: ERC20_ABI,
              address: t.address,
              functionName: 'allowance' as const,
              args: [owner, s.address],
            });
          }
        }

        const res = await client.multicall({ contracts, allowFailure: true });
        let i = 0;
        for (const t of tokens) {
          for (const s of spenders) {
            const r = res[i++];
            if (r.status === 'success') {
              const raw = r.result as unknown as bigint;
              if (raw > 0n) {
                all.push({
                  chainId,
                  chainName: cfg.name,
                  token: t,
                  spender: s,
                  allowanceRaw: raw,
                  allowancePretty: `${prettyAmount(raw, t.decimals)} ${t.symbol}`,
                  risk: riskFrom(raw, t.decimals),
                });
              }
            }
          }
        }
      }

      setFindings(all);
    } catch (e: any) {
      if (!err) setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head><title>CoinIntel Pro — Allowance Watch</title></Head>
      <main className="wrap">
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Brand subtitle="Allowance Watch" />
          <ConnectButton />
        </div>

        <p style={{ marginTop: 12, opacity: 0.9 }}>
          Scan ERC-20 allowances across Base, Arbitrum, BNB, Avalanche, Polygon, Optimism, and
          Ethereum. Revoke directly from results.
        </p>

        {/* form */}
        <section className="panel" style={{ marginTop: 14 }}>
          <div className="row" style={{ alignItems: 'end' }}>
            <div>
              <div className="label">Wallet address</div>
              <input
                className="input"
                placeholder="0x… or ENS (name.eth)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                spellCheck={false}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <SaveAddressButton address={input.trim()} />
              <AddressBook onSelect={(addr) => setInput(addr)} />
            </div>
          </div>

          <div className="row" style={{ marginTop: 12, alignItems: 'center' }}>
            <div>
              <div className="label">Chain</div>
              <select
                className="select"
                value={selectedChainId}
                onChange={(e) => setSelectedChainId(Number(e.target.value))}
                disabled={scanAll}
              >
                {chainsList.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <label className="checkboxRow" title="Scan across all configured chains">
                <input type="checkbox" checked={scanAll} onChange={(e) => setScanAll(e.target.checked)} />
                <span>Scan all chains</span>
              </label>
              <button className="btn" onClick={handleScan} disabled={loading}>
                {loading ? 'Scanning…' : 'Scan'}
              </button>
            </div>
          </div>

          {err && (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 10, border: '1px solid #7a2b2b', background: '#3a2222' }}>
              {err}
            </div>
          )}
        </section>

        {/* results */}
        <div style={{ marginTop: 14 }}>
          <SummaryBar findings={findings} loading={loading} />
          <Results findings={findings as any} />
        </div>
      </main>
    </>
  );
                  }
