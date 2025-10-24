import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Brand from '../components/Brand';
import ThemeToggle from '../components/ThemeToggle';
import ConnectButton from '../components/ConnectButton';
import SummaryBar from '../components/SummaryBar';
import Results from '../components/Results';

// We keep these imports exactly as your repo has them
import { getPublicClient } from '../lib/networks';
import { ERC20_ABI } from '../lib/erc20';
import { CHAINS } from '../config/chains';
import { TOKENS_BY_CHAIN } from '../config/tokens';
import { SPENDERS_BY_CHAIN } from '../config/spenders';

import { formatUnits, isAddress, maxUint256, type Address, getAddress } from 'viem';

/** Local Finding shape used by this page (kept structural so other component types don’t clash) */
type Finding = {
  chainId?: number;
  chain: string;
  token: string;
  tokenAddress?: Address;
  spender: Address;
  spenderName?: string;
  allowance: string;   // human string
  risk: 'unlimited' | 'high' | 'medium' | 'low' | 'info';
};

// helper to list selectable chains
const chainsList = Object.entries(CHAINS).map(([id, c]) => ({
  id: Number(id),
  name: c.name,
}));

export default function Home() {
  // ---------- UI state ----------
  const [input, setInput] = useState<string>('');
  const [selectedChain, setSelectedChain] = useState<'all' | number>('all'); // default = All supported
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // findings kept untyped here to avoid cross-module type mismatches
  const [findings, setFindings] = useState<Finding[]>([]);

  // ---------- derived ----------
  const validChecksum: Address | null = useMemo(() => {
    if (!input) return null;
    try {
      if (!isAddress(input as Address)) return null;
      return getAddress(input as Address);
    } catch {
      return null;
    }
  }, [input]);

  // ---------- scan logic ----------
  async function scan() {
    setError(null);
    setFindings([]);

    if (!validChecksum) {
      setError('Please enter a valid EVM address (0x… or checksummed).');
      return;
    }

    setLoading(true);
    try {
      const chainIds: number[] =
        selectedChain === 'all'
          ? chainsList.map((c) => c.id)
          : [selectedChain];

      const all: Finding[] = [];

      for (const cid of chainIds) {
        const chainCfg = (CHAINS as any)[cid];
        if (!chainCfg) continue;

        const client = getPublicClient(cid);
        if (!client) {
          // skip silently, but surface as a banner if *only* one was selected
          if (selectedChain !== 'all') {
            setError(`No RPC configured for chain ${cid}.`);
          }
          continue;
        }

        const tokens = (TOKENS_BY_CHAIN as any)[cid] ?? [];
        const spenders = (SPENDERS_BY_CHAIN as any)[cid] ?? [];
        if (!tokens.length || !spenders.length) continue;

        for (const t of tokens) {
          for (const s of spenders) {
            try {
              const value = (await client.readContract({
                address: t.address as Address,
                abi: ERC20_ABI as any,
                functionName: 'allowance',
                args: [validChecksum, s.address as Address],
              })) as bigint;

              if (value <= 0n) continue;

              const human = formatUnits(value, t.decimals ?? 18);

              // classify risk
              let risk: Finding['risk'] = 'info';
              if (value === maxUint256) risk = 'unlimited';
              else if (value >= 1_000_000n * 10n ** BigInt(t.decimals ?? 18)) risk = 'high';
              else if (value >= 100_000n * 10n ** BigInt(t.decimals ?? 18)) risk = 'medium';
              else risk = 'low';

              all.push({
                chainId: cid,
                chain: chainCfg.name,
                token: t.symbol || 'TOKEN',
                tokenAddress: t.address as Address,
                spender: s.address as Address,
                spenderName: s.name,
                allowance: human,
                risk,
              });
            } catch {
              // ignore individual read errors for robustness
            }
          }
        }
      }

      setFindings(all);
    } catch (e: any) {
      setError(e?.message || 'Unexpected error while scanning.');
    } finally {
      setLoading(false);
    }
  }

  // convenience for Enter key
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') scan();
  };

  // lightweight “save” + “address book” using localStorage (keeps your buttons functional)
  const saveCurrent = () => {
    if (!validChecksum) return setError('Enter a valid address before saving.');
    const raw = localStorage.getItem('aw:recent') || '[]';
    const arr: string[] = JSON.parse(raw);
    const next = [validChecksum, ...arr.filter((a) => a.toLowerCase() !== validChecksum.toLowerCase())].slice(0, 8);
    localStorage.setItem('aw:recent', JSON.stringify(next));
  };

  const openAddressBook = () => {
    try {
      const raw = localStorage.getItem('aw:recent') || '[]';
      const arr: string[] = JSON.parse(raw);
      const pick = prompt(`Recent addresses:\n\n${arr.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\nType exact address to use:`);
      if (pick && isAddress(pick as Address)) setInput(getAddress(pick as Address));
    } catch {
      // ignore
    }
  };

  return (
    <>
      <Head>
        <title>CoinIntel Pro — Allowance Watch</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="wrap">
        {/* Header */}
        <div className="topbar">
          <Brand subtitle="Allowance Watch" size="lg" />
          <div className="actions">
            <ThemeToggle />
            <ConnectButton />
          </div>
        </div>

        {/* Input Panel */}
        <div className="card" style={{ marginTop: 16 }}>
          <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
            <div className="col" style={{ flex: 1, minWidth: 240 }}>
              <label className="muted">Wallet Address</label>
              <input
                className="input"
                placeholder="0x… or ENS (name.eth)"
                value={input}
                onChange={(e) => setInput(e.target.value.trim())}
                onKeyDown={onKeyDown}
                inputMode="text"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />

              <div className="row" style={{ gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                <button className="btn secondary" onClick={saveCurrent}>★&nbsp;Save</button>
                <button className="btn" onClick={openAddressBook}>Address Book</button>
              </div>
            </div>

            <div className="col" style={{ width: 260, minWidth: 220 }}>
              <label className="muted">Chain</label>
              <select
                className="select"
                value={selectedChain === 'all' ? 'all' : String(selectedChain)}
                onChange={(e) => {
                  const v = e.target.value;
                  setSelectedChain(v === 'all' ? 'all' : Number(v));
                }}
              >
                <option value="all">All supported</option>
                {chainsList.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <button
                className="btn"
                style={{ marginTop: 8 }}
                onClick={scan}
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? 'Scanning…' : 'Scan'}
              </button>
            </div>
          </div>

          {error && (
            <div className="alert-danger" style={{ marginTop: 12 }}>
              {error}
            </div>
          )}
        </div>

        {/* Metrics + Results */}
        <div style={{ marginTop: 14 }}>
          <SummaryBar findings={findings as any} loading={loading} />
          <Results findings={findings as any} />
        </div>

        {/* Footnote */}
        <p className="footnote muted">
          <span className="kicker">Note:</span>
          Results are fetched from on-chain RPCs and best-effort token/spender maps.
          Always verify approvals before revoking. If a chain is rate-limited, try again or scan a single chain.
        </p>
      </main>
    </>
  );
}
