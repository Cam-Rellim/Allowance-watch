import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import {
  isAddress,
  formatUnits,
  type Address,
  getAddress,
  maxUint256,
} from 'viem';
import { getPublicClient } from '../lib/networks';
import { ERC20_ABI } from '../lib/erc20';
import { CHAINS, DEFAULT_CHAIN_ID } from '../config/chains';
import { TOKENS_BY_CHAIN } from '../config/tokens';
import { SPENDERS_BY_CHAIN } from '../config/spenders';

type Finding = {
  chainId: number;
  chainName: string;
  tokenSymbol: string;
  tokenAddress: Address;
  spenderLabel: string;
  spenderAddress: Address;
  allowance: string;     // human-friendly
  allowanceRaw: bigint;  // raw bigint
  decimals: number;
};

type Status = 'idle' | 'scanning' | 'done';

type BookEntry = {
  id: string;            // checksum address
  name: string;
  address: Address;      // checksum address
  updatedAt: number;
};

// ---------- helpers ----------
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const norm = (a: string): Address => getAddress(a as `0x${string}`);
const nfCompact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 });
const prettyAmount = (x: number) => (Number.isFinite(x) ? nfCompact.format(x) : '∞');

const BOOK_KEY = 'aw:book';
const RECENTS_KEY = 'aw:recents';
const MAX_RECENTS = 6;

const short = (addr: string) => addr.slice(0, 6) + '…' + addr.slice(-4);

export default function Home() {
  // --- app state ---
  const [owner, setOwner] = useState<string>('');
  const [ensResolvedNote, setEnsResolvedNote] = useState<string>(''); // "vitalik.eth → 0x123...”
  const [chainId, setChainId] = useState<number>(DEFAULT_CHAIN_ID);
  const [scanAll, setScanAll] = useState<boolean>(true);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string>('');
  const [findings, setFindings] = useState<Finding[]>([]);

  // --- address book / recents ---
  const [book, setBook] = useState<BookEntry[]>([]);
  const [bookOpen, setBookOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [recents, setRecents] = useState<Address[]>([]);

  // --- chain helpers ---
  const chainById = useMemo(
    () => Object.fromEntries(CHAINS.map((c) => [c.id, c])),
    []
  ) as Record<number, (typeof CHAINS)[number]>;

  const explorerBaseUrl = (cid: number) => chainById[cid]?.blockExplorers?.default?.url;

  // ---------- localStorage I/O ----------
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(BOOK_KEY);
      if (raw) setBook(JSON.parse(raw));
    } catch {}
    try {
      const raw = localStorage.getItem(RECENTS_KEY);
      if (raw) setRecents(JSON.parse(raw));
    } catch {}
  }, []);

  function persistBook(next: BookEntry[]) {
    setBook(next);
    if (typeof window !== 'undefined') localStorage.setItem(BOOK_KEY, JSON.stringify(next));
  }
  function persistRecents(next: Address[]) {
    setRecents(next);
    if (typeof window !== 'undefined') localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  }

  function addRecent(addr: Address) {
    const cs = getAddress(addr);
    const next = [cs, ...recents.filter((a) => getAddress(a) !== cs)].slice(0, MAX_RECENTS);
    persistRecents(next);
  }

  function saveToBook(name: string, addr: Address) {
    const cs = getAddress(addr);
    const existing = book.find((b) => b.id === cs);
    const entry: BookEntry = { id: cs, address: cs, name: name.trim() || short(cs), updatedAt: Date.now() };
    const next = existing ? book.map((b) => (b.id === cs ? entry : b)) : [entry, ...book].slice(0, 100);
    persistBook(next);
  }

  const deleteFromBook = (id: string) => persistBook(book.filter((b) => b.id !== id));

  // ---------- ENS resolution (mainnet only) ----------
  async function resolveEnsMaybe(input: string): Promise<Address | null> {
    if (!/\.eth$/i.test(input)) return null;
    try {
      const mainnet = getPublicClient(1);
      // @ts-ignore tolerate different viem versions
      const addr: Address | null = await mainnet.getEnsAddress({ name: input });
      return addr ? getAddress(addr) : null;
    } catch {
      return null;
    }
  }

  // ---------- scanning ----------
  async function scan() {
    setError('');
    setEnsResolvedNote('');

    let input = owner.trim();

    // resolve ENS if entered
    if (!isAddress(input as Address) && /\.eth$/i.test(input)) {
      const resolved = await resolveEnsMaybe(input);
      if (!resolved) {
        setError(`Could not resolve ${input}.`);
        setStatus('done');
        return;
      }
      setEnsResolvedNote(`${input} → ${resolved}`);
      input = resolved;
      setOwner(resolved);
    }

    if (!isAddress(input as Address)) {
      setError('Please enter a valid EVM address.');
      return;
    }
    const ownerAddr = getAddress(input as `0x${string}`);

    setStatus('scanning');
    setFindings([]);

    const chainIds = scanAll ? CHAINS.map((c) => c.id) : [chainId];
    const out: Finding[] = [];

    try {
      for (const cid of chainIds) {
        const chain = chainById[cid];
        const client = getPublicClient(cid);
        const tokens = TOKENS_BY_CHAIN[cid] ?? [];
        const spenders = SPENDERS_BY_CHAIN[cid] ?? [];

        for (const token of tokens) {
          // multicall decimals + all spender allowances
          const calls = [
            { address: norm(token.address), abi: ERC20_ABI, functionName: 'decimals' as const },
            ...spenders.map((sp) => ({
              address: norm(token.address),
              abi: ERC20_ABI,
              functionName: 'allowance' as const,
              args: [ownerAddr, norm(sp.address)] as const,
            })),
          ];

          const results = await client.multicall({ contracts: calls, allowFailure: true });

          // decimals is results[0]
          const dec = results[0]?.result;
          const decimals = typeof dec === 'number' ? dec : Number(dec ?? 18);

          // allowances follow
          for (let i = 1; i < results.length; i++) {
            const res = results[i];
            const allowance = (res?.result ?? 0n) as bigint;
            if (allowance > 0n) {
              const sp = spenders[i - 1];
              const asFloat = Number(formatUnits(allowance, decimals));
              const pretty = prettyAmount(asFloat) + ' ' + token.symbol;

              out.push({
                chainId: cid,
                chainName: chain.name,
                tokenSymbol: token.symbol,
                tokenAddress: norm(token.address),
                spenderLabel: sp.label,
                spenderAddress: norm(sp.address),
                allowance: pretty,
                allowanceRaw: allowance,
                decimals,
              });
            }
          }

          await sleep(60); // tiny pause helps strict public RPCs
        }
      }

      // Sort: chain -> token -> biggest first
      out.sort(
        (a, b) =>
          a.chainName.localeCompare(b.chainName) ||
          a.tokenSymbol.localeCompare(b.tokenSymbol) ||
          (b.allowanceRaw > a.allowanceRaw ? 1 : b.allowanceRaw < a.allowanceRaw ? -1 : 0)
      );

      setFindings(out);
      addRecent(ownerAddr);
    } catch (e: any) {
      const msg = String(e?.message || e);
      setError(msg.includes('429')
        ? 'Public RPC rate limit (429). Try again shortly or set a custom RPC in settings.'
        : msg
      );
    } finally {
      setStatus('done');
    }
  }

  const buttonLabel =
    status === 'scanning' ? 'Scanning…' : status === 'done' ? 'Scan again' : 'Scan';

  const isHigh = (x: bigint, decimals: number) => {
    try {
      const v = Number(formatUnits(x, decimals));
      return Number.isFinite(v) && v >= 10_000;
    } catch {
      return false;
    }
  };

  // export / import address book
  async function exportBook() {
    const payload = JSON.stringify(book, null, 2);
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(payload);
      alert('Address book copied to clipboard.');
    } else {
      alert(payload);
    }
  }
  async function importBook() {
    const payload = prompt('Paste the JSON you exported earlier:');
    if (!payload) return;
    try {
      const data = JSON.parse(payload) as BookEntry[];
      const sanitized = Array.isArray(data)
        ? data
            .filter((d) => d?.address || d?.id)
            .map((d) => {
              const a = getAddress(((d.address as string) || (d.id as string)) as `0x${string}`);
              return {
                id: a,
                address: a,
                name: String(d.name || '').slice(0, 64) || short(a),
                updatedAt: Number(d.updatedAt || Date.now()),
              } as BookEntry;
            })
        : [];
      persistBook(sanitized);
      alert(`Imported ${sanitized.length} entries.`);
    } catch (e: any) {
      alert('Import failed: ' + (e?.message || String(e)));
    }
  }

  return (
    <div>
      <Head>
        <title>Allowance Watch</title>
      </Head>
      <main className="wrap">
        <h1>Allowance Watch</h1>
        <p className="sub">
          Scan ERC-20 allowances across Base, Arbitrum, BNB, Avalanche, and Ethereum.
        </p>

        <label htmlFor="owner" className="label">Wallet address</label>
        <div className="rowFlex">
          <input
            id="owner"
            placeholder="0x... or ENS (name.eth)"
            value={owner}
            onFocus={(e) => e.currentTarget.select()}
            onChange={(e) => { setOwner(e.target.value); if (status === 'done') setStatus('idle'); }}
            onKeyDown={(e) => { if (e.key === 'Enter' && status !== 'scanning') scan(); }}
            className="input grow"
            inputMode="text"
            autoCapitalize="none"
            autoCorrect="off"
          />
          <button className="button subtle" onClick={() => { setSaveOpen(v => !v); setBookOpen(false); }}>
            ⭐ Save
          </button>
          <button className="button subtle" onClick={() => { setBookOpen(v => !v); setSaveOpen(false); }}>
            Address Book
          </button>
        </div>

        {ensResolvedNote && <div className="ens">{ensResolvedNote}</div>}

        {/* Save form */}
        {saveOpen && (
          <div className="panel">
            <div className="panelRow">
              <input
                placeholder="Name (e.g., Cold Wallet)"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                className="input"
              />
            </div>
            <div className="panelRow">
              <button
                className="button"
                onClick={() => {
                  try {
                    const addr = isAddress(owner as Address) ? getAddress(owner as `0x${string}`) : norm(owner);
                    saveToBook(saveName, addr);
                    setSaveName('');
                    setSaveOpen(false);
                  } catch {
                    alert('Enter a valid address first.');
                  }
                }}
              >
                Save Address
              </button>
            </div>
          </div>
        )}

        {/* Address book */}
        {bookOpen && (
          <div className="panel">
            {book.length === 0 && <div className="muted">No saved addresses yet.</div>}
            {book.map((b) => (
              <div className="abRow" key={b.id}>
                <div className="abInfo">
                  <div className="abName">{b.name}</div>
                  <div className="abAddr">{short(b.address)}</div>
                </div>
                <div className="abActions">
                  <button className="chip" onClick={() => { setOwner(b.address); setBookOpen(false); }}>
                    Fill
                  </button>
                  <button
                    className="chip"
                    onClick={() => {
                      const newName = prompt('Rename entry:', b.name)?.trim();
                      if (!newName) return;
                      saveToBook(newName, b.address);
                    }}
                  >
                    Rename
                  </button>
                  <button className="chip danger" onClick={() => deleteFromBook(b.id)}>Delete</button>
                </div>
              </div>
            ))}
            {book.length > 0 && (
              <div className="panelRow">
                <button className="button subtle" onClick={exportBook}>Export</button>
                <button className="button subtle" onClick={importBook}>Import</button>
              </div>
            )}
          </div>
        )}

        {/* Recents */}
        {recents.length > 0 && (
          <div className="recents">
            <div className="labelSmall">Recent</div>
            <div className="chips">
              {recents.map((r) => (
                <button className="chip" key={r} onClick={() => setOwner(r)}>
                  {short(r)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="controls">
          <select
            value={chainId}
            onChange={(e) => setChainId(Number(e.target.value))}
            disabled={scanAll}
            title={scanAll ? 'Disable "Scan all chains" to pick a single network' : 'Choose network to scan'}
            className="select"
            style={{ opacity: scanAll ? 0.5 : 1 }}
          >
            {CHAINS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <label className="check">
            <input type="checkbox" checked={scanAll} onChange={(e) => setScanAll(e.target.checked)} />
            Scan all chains
          </label>

          <button
            onClick={() => (status === 'done' ? (setStatus('idle'), setFindings([]), setError('')) : scan())}
            disabled={status === 'scanning'}
            className="button"
          >
            {buttonLabel}
          </button>
        </div>

        {/* Status & errors */}
        <div className="status">
          {status === 'idle' && <span className="muted">Enter a wallet and press Scan.</span>}
          {status === 'scanning' && <span className="muted"><span className="spinner" /> Scanning… this may take a few seconds.</span>}
          {error && <div className="error">{error}</div>}
        </div>

        {/* Results */}
        {status === 'done' && findings.length === 0 && !error && (
          <div className="empty">No approvals &gt; 0 found for the configured tokens/spenders.</div>
        )}

        {status === 'done' && findings.length > 0 && (
          <>
            {/* Desktop table */}
            <table className="table">
              <thead>
                <tr>
                  <th>Chain</th>
                  <th>Token</th>
                  <th>Spender</th>
                  <th>Allowance</th>
                </tr>
              </thead>
              <tbody>
                {findings.map((f, i) => {
                  const exp = explorerBaseUrl(f.chainId);
                  const tokenLink = exp ? `${exp}/address/${f.tokenAddress}` : undefined;
                  const spenderLink = exp ? `${exp}/address/${f.spenderAddress}` : undefined;
                  return (
                    <tr key={i}>
                      <td><span className="badge">{f.chainName}</span></td>
                      <td title={f.tokenAddress}>
                        {tokenLink ? <a href={tokenLink} target="_blank" rel="noreferrer">{f.tokenSymbol}</a> : f.tokenSymbol}
                      </td>
                      <td title={f.spenderAddress}>
                        {spenderLink ? <a href={spenderLink} target="_blank" rel="noreferrer">{f.spenderLabel}</a> : f.spenderLabel}
                      </td>
                      <td>
                        {f.allowance}
                        {(f.allowanceRaw >= maxUint256 / 2n) && <span className="tag warn">Unlimited</span>}
                        {(f.allowanceRaw < maxUint256 / 2n) && isHigh(f.allowanceRaw, f.decimals) && <span className="tag">High</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="cards">
              {findings.map((f, i) => {
                const exp = explorerBaseUrl(f.chainId);
                const tokenLink = exp ? `${exp}/address/${f.tokenAddress}` : undefined;
                const spenderLink = exp ? `${exp}/address/${f.spenderAddress}` : undefined;
                return (
                  <div className="card" key={i}>
                    <div className="cardHead">
                      <span className="badge">{f.chainName}</span>
                      <div className="amt">
                        {f.allowance}
                        {(f.allowanceRaw >= maxUint256 / 2n) && <span className="tag warn">Unlimited</span>}
                        {(f.allowanceRaw < maxUint256 / 2n) && isHigh(f.allowanceRaw, f.decimals) && <span className="tag">High</span>}
                      </div>
                    </div>
                    <div className="row">
                      <div className="labelSmall">Token</div>
                      <div className="valueSmall">
                        {tokenLink ? <a href={tokenLink} target="_blank" rel="noreferrer">{f.tokenSymbol}</a> : f.tokenSymbol}
                      </div>
                    </div>
                    <div className="row">
                      <div className="labelSmall">Spender</div>
                      <div className="valueSmall">
                        {spenderLink ? <a href={spenderLink} target="_blank" rel="noreferrer">{f.spenderLabel}</a> : f.spenderLabel}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <style jsx>{`
          .wrap { max-width: 960px; margin: 0 auto; padding: 16px; }
          h1 { font-size: 32px; margin: 8px 0 4px; }
          .sub { color: #4b5563; margin: 0 0 12px; }
          .label { display:block; margin: 8px 0 6px; font-weight: 600; }

          .rowFlex { display: flex; gap: 8px; align-items: center; }
          .grow { flex: 1 1 auto; }

          .input { width: 100%; padding: 12px; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 16px; }
          .button { padding: 10px 14px; border-radius: 10px; border: 1px solid #111827; background: white; }
          .button.subtle { border-color: #e5e7eb; }

          .ens { margin-top: 6px; color: #374151; font-size: 14px; }

          .panel { border: 1px solid #e5e7eb; border-radius: 12px; padding: 10px; margin-top: 8px; }
          .panelRow { margin: 6px 0; }

          .abRow { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f3f4f6; padding: 8px 0; }
          .abRow:first-child { border-top: 0; }
          .abInfo { display: grid; gap: 2px; }
          .abName { font-weight: 600; }
          .abAddr { color: #6b7280; font-size: 12px; }
          .abActions { display: flex; gap: 6px; }
          .chip { font-size: 12px; padding: 4px 8px; border-radius: 999px; border: 1px solid #e5e7eb; background: #f9fafb; }
          .chip.danger { background: #fff1f2; border-color: #fecdd3; color: #be123c; }

          .recents { margin-top: 10px; }
          .labelSmall { color: #6b7280; margin-bottom: 4px; }
          .chips { display: flex; gap: 6px; flex-wrap: wrap; }

          .controls { display: flex; gap: 8px; align-items: center; margin-top: 12px; }
          .select { padding: 10px; border-radius: 8px; border: 1px solid #e5e7eb
