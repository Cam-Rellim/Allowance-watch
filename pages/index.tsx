// pages/index.tsx
import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import ThemeToggle from '../components/ThemeToggle';
import ConnectButton from '../components/ConnectButton';
import Brand from '../components/Brand';
import SummaryBar, { type Finding } from '../components/SummaryBar';
import Results from '../components/Results';

import { getPublicClient } from '../lib/networks';
import { ERC20_ABI } from '../lib/erc20';
import { normalizeInputToAddressOrEns } from '../lib/addr';

import { TOKENS_BY_CHAIN } from '../config/tokens';
import { SPENDERS_BY_CHAIN } from '../config/spenders';
import { CHAINS } from '../config/chains';

type BookItem = { address: `0x${string}`; name?: string };

const RECENT_KEY = 'aw_recent';
const BOOK_KEY = 'aw_book';

function loadRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function saveRecent(list: string[]) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 8)));
}
function loadBook(): Record<string, BookItem> {
  try { return JSON.parse(localStorage.getItem(BOOK_KEY) || '{}'); } catch { return {}; }
}
function saveBook(book: Record<string, BookItem>) {
  localStorage.setItem(BOOK_KEY, JSON.stringify(book));
}

export default function Home() {
  // ----- UI state
  const [addrInput, setAddrInput] = useState('');
  const [selectedChain, setSelectedChain] = useState<number>(8453); // Base default
  const [scanAll, setScanAll] = useState(true);
  const [loading, setLoading] = useState(false);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [errors, setErrors] = useState<{ chain: string; msg: string }[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [book, setBook] = useState<Record<string, BookItem>>({});
  const [bookOpen, setBookOpen] = useState(false);

  // ----- Init persisted bits
  useEffect(() => { setRecent(loadRecent()); setBook(loadBook()); }, []);

  const chainOptions = useMemo(() => {
    // CHAINS is Record<number, {id,name,...}>
    return Object.values(CHAINS as Record<string, any>)
      .map((c) => ({ id: Number(c.id ?? c.chainId ?? c), name: c.name ?? c.title ?? String(c.id) }))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, []);

  // ----- Helpers
  function remember(addr: string) {
    const next = [addr, ...recent.filter((a) => a.toLowerCase() !== addr.toLowerCase())];
    setRecent(next);
    saveRecent(next);
  }

  function saveCurrentToBook(addr: `0x${string}`) {
    const name = prompt('Name this address (optional):') || undefined;
    const next = { ...book, [addr.toLowerCase()]: { address: addr, name } };
    setBook(next);
    saveBook(next);
  }

  async function scan() {
    setErrors([]);
    setFindings([]);
    setLoading(true);
    try {
      const owner = await normalizeInputToAddressOrEns(addrInput);
      remember(owner);

      const targetChainIds = scanAll
        ? Object.keys(CHAINS).map((k) => Number(k))
        : [selectedChain];

      const allFindings: Finding[] = [];

      for (const cid of targetChainIds) {
        const cfg: any = (CHAINS as any)[cid];
        const chainName = cfg?.name ?? `Chain ${cid}`;
        const client = getPublicClient(cid);

        const tokens = (TOKENS_BY_CHAIN as any)[cid] || [];
        const spenders = (SPENDERS_BY_CHAIN as any)[cid] || [];
        if (!tokens.length || !spenders.length) continue;

        // build multicall list
        const contracts = [];
        for (const t of tokens) {
          for (const s of spenders) {
            contracts.push({
              address: t.address as `0x${string}`,
              abi: ERC20_ABI,
              functionName: 'allowance' as const,
              args: [owner, s.address as `0x${string}`],
            });
          }
        }

        try {
          const res = await client.multicall({ contracts, allowFailure: true });
          let idx = 0;
          for (const t of tokens) {
            for (const s of spenders) {
              const out = res[idx++];
              if (!out || out.status !== 'success') continue;
              const raw = BigInt(out.result as unknown as string);
              if (raw > 0n) {
                // format with token decimals if present
                const d = Number(t.decimals ?? 18);
                const pretty =
                  Number(raw) === 0
                    ? '0'
                    : (Number(raw) / Math.pow(10, d)).toLocaleString(undefined, {
                        maximumFractionDigits: 6,
                      }) + ` ${t.symbol}`;
                allFindings.push({
                  chainId: cid,
                  chain: chainName,
                  token: t.symbol,
                  spender: s.address,
                  spenderName: s.name,
                  allowance: pretty,
                });
              }
            }
          }
        } catch (err: any) {
          const msg = err?.shortMessage || err?.message || String(err);
          setErrors((prev) => [...prev, { chain: chainName, msg }]);
        }
      }

      setFindings(allFindings);
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  // ----- Render
  return (
    <>
      <Head>
        <title>CoinIntel Pro — Allowance Watch</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="wrap">
        {/* Header */}
        <div className="row space-between center">
          <Brand subtitle="Allowance Watch" />
          <div className="row center" style={{ gap: 8 }}>
            <ThemeToggle />
            <ConnectButton />
          </div>
        </div>

        <p className="lede">
          Scan ERC-20 allowances across Base, Arbitrum, BNB, Avalanche, Polygon, Optimism, and
          Ethereum. Revoke directly from results.
        </p>

        {/* Form card */}
        <div className="card">
          <div className="grid2">
            <div>
              <label className="label">Wallet address</label>
              <input
                className="input"
                placeholder="0x… or ENS (name.eth)"
                value={addrInput}
                onChange={(e) => setAddrInput(e.target.value)}
              />
              {/* Recent */}
              {recent.length > 0 && (
                <div className="chips">
                  {recent.map((a) => (
                    <button key={a} className="chip" onClick={() => setAddrInput(a)}>
                      {a.slice(0, 6)}…{a.slice(-4)}
                    </button>
                  ))}
                </div>
              )}
              <div className="row" style={{ gap: 10, marginTop: 6 }}>
                <button
                  className="linkish"
                  onClick={async () => {
                    try {
                      const normalized = await normalizeInputToAddressOrEns(addrInput);
                      saveCurrentToBook(normalized);
                      alert('Saved to Address Book.');
                    } catch (e: any) {
                      alert(e?.message || String(e));
                    }
                  }}
                >
                  ★ Save
                </button>
                <button className="linkish" onClick={() => setBookOpen(true)}>
                  Address Book
                </button>
              </div>
            </div>

            <div>
              <label className="label">Chain</label>
              <select
                className="input"
                value={selectedChain}
                onChange={(e) => setSelectedChain(Number(e.target.value))}
                disabled={scanAll}
              >
                {chainOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <label className="check">
                <input
                  type="checkbox"
                  checked={scanAll}
                  onChange={(e) => setScanAll(e.target.checked)}
                />
                <span>Scan all chains</span>
              </label>

              <button className="btn" onClick={scan} disabled={loading}>
                {loading ? 'Scanning…' : 'Scan'}
              </button>
            </div>
          </div>
        </div>

        {/* Errors per chain */}
        {errors.map((er, i) => (
          <div key={i} className="alert">
            <strong>{er.chain}:</strong> {er.msg}
          </div>
        ))}

        {/* Summary + Results */}
        <div style={{ marginTop: 14 }}>
          <SummaryBar findings={findings} loading={loading} />
          <Results findings={findings} />
        </div>
      </main>

      {/* Address Book modal (very small & simple) */}
      {bookOpen && (
        <div className="modal-backdrop" onClick={() => setBookOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Address Book</h3>
            {!Object.keys(book).length && <p>No saved addresses yet.</p>}
            {!!Object.keys(book).length && (
              <ul className="book">
                {Object.values(book).map((b) => (
                  <li key={b.address.toLowerCase()}>
                    <button
                      className="chip"
                      onClick={() => {
                        setAddrInput(b.address);
                        setBookOpen(false);
                      }}
                      title={b.address}
                    >
                      {b.name ? `${b.name} — ` : ''}
                      {b.address.slice(0, 6)}…{b.address.slice(-4)}
                    </button>
                    <button
                      className="linkish danger"
                      onClick={() => {
                        const next = { ...book };
                        delete next[b.address.toLowerCase()];
                        setBook(next);
                        saveBook(next);
                      }}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="row right">
              <button className="btn" onClick={() => setBookOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
