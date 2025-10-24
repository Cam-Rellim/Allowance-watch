import Head from 'next/head';
import React, { useCallback, useMemo, useState } from 'react';
import { isAddress, getAddress, formatUnits, maxUint256 } from 'viem';

import Brand from '../components/Brand';
import ThemeToggle from '../components/ThemeToggle';
import ConnectButton from '../components/ConnectButton';
import SummaryBar from '../components/SummaryBar';
import Results from '../components/Results';
import SaveAddressButton from '../components/SaveAddressButton';
import AddressBook from '../components/AddressBook';
import RecentAddresses from '../components/RecentAddresses';

import { getPublicClient } from '../lib/networks';
import { ERC20_ABI } from '../lib/erc20';

import { CHAINS } from '../config/chains';
import { TOKENS_BY_CHAIN } from '../config/tokens';
import { SPENDERS_BY_CHAIN } from '../config/spenders';

// ---- Types (local superset so we stay compatible with both components) ----
type RiskLevel = 'high' | 'medium' | 'low' | 'info';

type Finding = {
  chainId: number;
  chain: string;
  token: string;
  tokenAddress?: `0x${string}`;
  spender: `0x${string}`;
  spenderName?: string;
  allowance: string; // human formatted
  risk: RiskLevel;
};

// ---- Helpers ----
function short(addr: string, left = 6, right = 4) {
  if (!addr) return '';
  return addr.slice(0, left) + '…' + addr.slice(-right);
}

async function resolveOwner(input: string): Promise<`0x${string}` | null> {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Try EVM address (lenient), then checksum it
  if (isAddress(trimmed, { strict: false })) {
    try {
      return getAddress(trimmed);
    } catch {
      return null;
    }
  }

  // Optional ENS resolution against mainnet, if available
  try {
    if (trimmed.endsWith('.eth')) {
      const mainnetId = 1;
      const client = getPublicClient(mainnetId);
      if (client && 'getEnsAddress' in client) {
        // @ts-ignore - viem client has getEnsAddress on mainnet only
        const addr = await client.getEnsAddress({ name: trimmed });
        return addr ? (getAddress(addr) as `0x${string}`) : null;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

// Risk heuristics (simple; you can refine later)
function classifyRisk(raw: bigint, decimals: number) {
  if (raw === maxUint256) return 'high' as RiskLevel;
  // >= 1000 units => medium, >0 => low
  const thousand = BigInt(10) ** BigInt(decimals) * 1000n;
  if (raw >= thousand) return 'medium' as RiskLevel;
  if (raw > 0n) return 'low' as RiskLevel;
  return 'info' as RiskLevel;
}

// ---- Page ----
type ChainChoice = 'all' | number;

export default function HomePage() {
  // UI state
  const [rawInput, setRawInput] = useState<string>('');
  const [owner, setOwner] = useState<`0x${string}` | null>(null);

  const [chainChoice, setChainChoice] = useState<ChainChoice>('all'); // default = all chains
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>('');

  const [findings, setFindings] = useState<Finding[]>([]);

  // Build chain list once
  const chainsList = useMemo(
    () =>
      Object.entries(CHAINS).map(([id, cfg]) => ({
        id: Number(id),
        name: (cfg as any).name ?? `Chain ${id}`,
      })),
    []
  );

  const onScan = useCallback(async () => {
    setLoading(true);
    setErr('');
    setFindings([]);

    try {
      const resolved = await resolveOwner(rawInput);
      if (!resolved) {
        setErr('Please enter a valid EVM address or ENS.');
        setLoading(false);
        return;
      }
      setOwner(resolved);

      const ids: number[] =
        chainChoice === 'all'
          ? Object.keys(CHAINS).map(Number)
          : [chainChoice as number];

      const out: Finding[] = [];

      for (const cid of ids) {
        const chainCfg = (CHAINS as any)[cid];
        const client = getPublicClient(cid);
        if (!client) {
          // Collect error but continue scanning other chains
          setErr((prev) => (prev ? prev + '\n' : '') + `No RPC configured for chain ${cid}`);
          continue;
        }

        const tokens = (TOKENS_BY_CHAIN as any)[cid] ?? [];
        const spenders = (SPENDERS_BY_CHAIN as any)[cid] ?? [];

        for (const t of tokens) {
          const tokenAddr = t.address as `0x${string}`;
          const sym = t.symbol as string;
          const decimals = Number(t.decimals ?? 18);

          for (const s of spenders) {
            const spender = getAddress(s.address) as `0x${string}`;

            let raw: bigint = 0n;
            try {
              raw = (await client.readContract({
                address: tokenAddr,
                abi: ERC20_ABI as any,
                functionName: 'allowance',
                args: [resolved, spender],
              })) as bigint;
            } catch (e) {
              // Skip this pair but keep going
              continue;
            }

            if (raw > 0n) {
              const amount = formatUnits(raw, decimals);
              const risk = classifyRisk(raw, decimals);
              out.push({
                chainId: cid,
                chain: chainCfg?.name ?? `Chain ${cid}`,
                token: sym,
                tokenAddress: tokenAddr,
                spender,
                spenderName: s.name as string | undefined,
                allowance: `${amount} ${sym}`,
                risk,
              });
            }
          }
        }
      }

      setFindings(out);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [rawInput, chainChoice]);

  return (
    <>
      <Head>
        <title>CoinIntel Pro — Allowance Watch</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="wrap" style={{ paddingBottom: 40 }}>
        {/* Header */}
        <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Brand subtitle="Allowance Watch" size="lg" />
          <div className="row" style={{ gap: 10 }}>
            <ThemeToggle />
            <ConnectButton />
          </div>
        </div>

        {/* Lead copy */}
        <p className="lead" style={{ marginTop: 12 }}>
          Scan ERC-20 allowances across Base, Arbitrum, BNB, Avalanche, Polygon, Optimism, and Ethereum.
          Revoke directly from results.
        </p>

        {/* Card */}
        <div className="card" style={{ marginTop: 16 }}>
          <div className="row" style={{ gap: 12, alignItems: 'flex-end' }}>
            <div className="col">
              <label className="lbl">Wallet Address</label>
              <input
                className="inp"
                type="text"
                placeholder="0x… or ENS (name.eth)"
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                inputMode="text"
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
              />
              <div className="row" style={{ gap: 14, marginTop: 8 }}>
                {/* These components existed previously; we keep them visible.
                   We use ts-ignore to avoid breaking on prop signature drift. */}
                {/* @ts-ignore */}
                <SaveAddressButton address={owner ?? undefined} />
                {/* @ts-ignore */}
                <AddressBook onSelect={(addr: string) => setRawInput(addr)} />
                {/* @ts-ignore */}
                <RecentAddresses onPick={(addr: string) => setRawInput(addr)} />
              </div>
            </div>

            <div>
              <label className="lbl">Chain</label>
              <select
                className="inp"
                value={chainChoice}
                onChange={(e) => {
                  const v = e.target.value === 'all' ? 'all' : Number(e.target.value);
                  setChainChoice(v);
                }}
              >
                <option value="all">All supported</option>
                {chainsList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <button className="btn" onClick={onScan} disabled={loading}>
                {loading ? 'Scanning…' : 'Scan'}
              </button>
            </div>
          </div>

          {/* Status */}
          {owner && (
            <div className="muted" style={{ marginTop: 10 }}>
              Resolved: <code>{short(owner)}</code>
            </div>
          )}
          {err && (
            <div className="alert error" style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>
              {err}
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
