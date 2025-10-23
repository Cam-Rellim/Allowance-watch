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
import Results, { type Finding as ResultsFinding } from '../components/Results';
import ThemeToggle from '../components/ThemeToggle';
import RecentAddresses, { pushRecentAddress } from '../components/RecentAddresses';

// ---- local shapes ----
type Token = { address: Address; symbol: string; decimals: number };
type Spender = { address: Address; name: string };
type Finding = ResultsFinding;

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

  // results state
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [failCount, setFailCount] = useState(0);

  // chains list (robust to shapes)
  type SimpleChain = { id: number; name: string };
  const chainsList: SimpleChain[] = useMemo(() => {
    const vals = Object.values(CHAINS as any);
    const list = vals.map((c: any) => ({
      id: Number(c?.id ?? c),
      name: String(c?.name ?? c),
    }));
    const seen = new Set<number>();
    return list.filter((c) => !seen.has(c.id) && seen.add(c.id)).sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  async function normalizeToAddress(text: string): Promise<Address> {
    const t = text.trim();
    if (isAddress(t)) return getAddress(t);
    if (t.endsWith('.eth')) {
      const client = getPublicClient(1);
      const addr = await client.getEnsAddress({ name: t as any }).catch(() => null);
      if (addr && isAddress(addr)) return getAddress(addr);
    }
    throw new Error('Please enter a valid EVM address.');
  }

  function riskFrom(raw: bigint, decimals: number): 'high' | 'med' | 'low' {
    const whole = Number(prettyAmount(raw, decimals).split('.')[0] || '0');
    if (whole >= 1_000_000) return 'high';
    if (whole >= 10_000) return 'med';
    return 'low';
  }

  async function handleScan() {
    setErr(null);
    setFindings([]);
    setFailCount(0);

    let owner: Address;
    try {
      owner = await normalizeToAddress(input);
    } catch (e: any) {
      setErr(e?.message || String(e));
      return;
    }

    // store in recent chips
    try { pushRecentAddress(owner); } catch {}

    setLoading(true);
    try {
      const chainIds = scanAll ? chainsList.map((c) => c.id) : [selectedChainId];
      const all: Finding[] = [];
      let failures = 0;

      for (const chainId of chainIds) {
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
                const chainCfg = (CHAINS as any)[chainId] ?? { id: chainId, name: String(chainId) };
                const chainName = String(chainCfg.name ?? chainId);
                all.push({
                  chainId,
                  chainName,
                  token: t,
                  spender: s,
                  allowanceRaw: raw,
                  allowancePretty: `${prettyAmount(raw, t.decimals)} ${t.symbol}`,
                  risk: riskFrom(raw, t.decimals),
                });
              }
            } else {
              failures++;
            }
          }
        }
      }

      setFindings(all);
      setFailCount(failures);

      if (all.length === 0 && failures === 0) {
        // Transparent note: curated list limitation
        setErr(
          'No allowances found among the curated tokens/spenders scanned. This does not guarantee zero allowances overall. We’ll expand coverage next.'
        );
      }
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>CoinIntel Pro — Allowance Watch</title>
      </Head>

      <main className="wrap">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Brand subtitle="Allowance Watch" />
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <ThemeToggle />
            <ConnectButton />
          </div>
        </div>

        <p style={{ marginTop: 12, opacity: 0.9 }}>
          Scan ERC-20 allowances across Base, Arbitrum, BNB, Avalanche, Polygon, Optimism, and Ethereum. Revoke directly from results.
        </p>

        {/* Form */}
        <section className="panel" style={{ marginTop: 14 }}>
          <div className="row" style={{ alignItems: 'end' }}>
            <div className="col">
              <div className="label">Wallet address</div>
              <input
                className="input"
                placeholder="0x… or ENS (name.eth)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                spellCheck={false}
              />
              {/* Recent chips */}
              <RecentAddresses onSelect={(addr) => setInput(addr)} />
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <SaveAddressButton address={input.trim()} />
              <AddressBook onSelect={(addr) => setInput(addr)} />
            </div>
          </div>

          <div className="row" style={{ marginTop: 12, alignItems: 'center' }}>
            <div className="col">
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
                <input
                  type="checkbox"
                  checked={scanAll}
                  onChange={(e) => setScanAll(e.target.checked)}
                />
                <span>Scan all chains</span>
              </label>
              <button className="btn" onClick={handleScan} disabled={loading}>
                {loading ? 'Scanning…' : 'Scan'}
              </button>
            </div>
          </div>

          {failCount > 0 && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 10,
                border: '1px solid #856404',
                background: '#3a320f',
              }}
            >
              {failCount} contract calls failed and were skipped. This can happen with unreliable RPCs; results still include all successful calls.
            </div>
          )}

          {err && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 10,
                border: '1px solid #7a2b2b',
                background: '#3a2222',
              }}
            >
              {err}
            </div>
          )}
        </section>

        {/* Results */}
        <div style={{ marginTop: 14 }}>
          <SummaryBar findings={findings} loading={loading} />
          <Results findings={findings} />
        </div>
      </main>
    </>
  );
}
