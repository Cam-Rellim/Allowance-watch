import { useMemo, useState } from 'react';
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
  allowance: string;     // pretty string we show
  allowanceRaw: bigint;  // raw bigint (for tags/sorting)
  decimals: number;
};

type Status = 'idle' | 'scanning' | 'done';

// helpers
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const norm = (a: string): Address => getAddress(a as `0x${string}`);
const nfCompact = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 2,
});

function prettyAmount(x: number) {
  if (!Number.isFinite(x)) return '∞';
  if (x === 0) return '0';
  return nfCompact.format(x);
}

export default function Home() {
  const [owner, setOwner] = useState<string>('');
  const [chainId, setChainId] = useState<number>(DEFAULT_CHAIN_ID);
  const [scanAll, setScanAll] = useState<boolean>(true); // default: scan across all chains
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string>('');
  const [findings, setFindings] = useState<Finding[]>([]);

  const chainById = useMemo(
    () => Object.fromEntries(CHAINS.map((c) => [c.id, c])),
    []
  ) as Record<number, (typeof CHAINS)[number]>;

  function explorerBaseUrl(cid: number): string | undefined {
    const c = chainById[cid];
    return c?.blockExplorers?.default?.url;
  }

  async function scan() {
    setError('');
    const input = owner.trim();
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
          // Batch decimals + all spender allowances using on-chain multicall
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
              // pretty amount
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

          // tiny pause helps with strict public RPCs
          await sleep(60);
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
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (msg.includes('429')) {
        setError('Public RPC rate limit (429). Try again shortly or set a custom RPC in settings.');
      } else {
        setError(msg);
      }
    } finally {
      setStatus('done');
    }
  }

  const buttonLabel =
    status === 'scanning' ? 'Scanning…' : status === 'done' ? 'Scan again' : 'Scan';

  // tags
  const isUnlimited = (x: bigint) => x >= maxUint256 / 2n; // ~unlimited threshold
  const isHigh = (x: bigint, decimals: number) => {
    // over ~10,000 units (heuristic)
    try {
      const v = Number(formatUnits(x, decimals));
      return Number.isFinite(v) && v >= 10_000;
    } catch {
      return false;
    }
  };

  return (
    <>
      <Head><title>Allowance Watch</title></Head>
      <main className="wrap">
        <h1>Allowance Watch</h1>
        <p className="sub">
          Scan ERC-20 allowances across Base, Arbitrum, BNB, Avalanche, and Ethereum.
        </p>

        <label htmlFor="owner" className="label">Wallet address</label>
        <input
          id="owner"
          placeholder="0x..."
          value={owner}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => { setOwner(e.target.value); if (status === 'done') setStatus('idle'); }}
          onKeyDown={(e) => { if (e.key === 'Enter' && status !== 'scanning') scan(); }}
          className="input"
        />

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
          {status === 'scanning' && (
            <span className="muted"><span className="spinner" /> Scanning… this may take a few seconds.</span>
          )}
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
                        {isUnlimited(f.allowanceRaw) && <span className="tag warn">Unlimited</span>}
                        {!isUnlimited(f.allowanceRaw) && isHigh(f.allowanceRaw, f.decimals) && <span className="tag">High</span>}
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
                        {isUnlimited(f.allowanceRaw) && <span className="tag warn">Unlimited</span>}
                        {!isUnlimited(f.allowanceRaw) && isHigh(f.allowanceRaw, f.decimals) && <span className="tag">High</span>}
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
          .input { width: 100%; padding: 12px; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 16px; }
          .controls { display: flex; gap: 8px; align-items: center; margin-top: 10px; }
          .select { padding: 10px; border-radius: 8px; border: 1px solid #e5e7eb; }
          .check { display: flex; align-items: center; gap: 6px; font-size: 14px; }
          .button { margin-left: auto; padding: 10px 14px; border-radius: 10px; border: 1px solid #111827; background: white; }
          .muted { color: #6b7280; }
          .status { margin-top: 12px; }
          .error { margin-top: 8px; color: #b91c1c; background: #fee2e2; border: 1px solid #fecaca; padding: 8px 10px; border-radius: 10px; }
          .empty { margin-top: 12px; color: #6b7280; }

          .table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; vertical-align: top; }
          th { background: #f9fafb; }
          a { color: #111827; text-decoration: underline; text-underline-offset: 3px; }
          a:hover { opacity: 0.8; }

          .badge { display:inline-block; font-size: 12px; padding: 2px 8px; border-radius: 999px; background: #eef2ff; color: #1e293b; border: 1px solid #e5e7eb; }
          .tag { margin-left: 8px; font-size: 12px; padding: 2px 8px; border-radius: 999px; background: #f1f5f9; border: 1px solid #e5e7eb; }
          .tag.warn { background: #fff7ed; border-color: #fed7aa; color: #9a3412; }

          .spinner {
            display: inline-block; width: 14px; height: 14px; margin-right: 8px;
            border: 2px solid #e5e7eb; border-top-color: #111827; border-radius: 50%;
            animation: spin 0.9s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }

          /* Mobile cards */
          .cards { display: none; }
          .card { border: 1px solid #e5e7eb; border-radius: 14px; padding: 10px; margin-top: 10px; }
          .cardHead { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
          .amt { font-weight: 600; }
          .row { display: grid; grid-template-columns: 80px 1fr; gap: 8px; margin: 6px 0; }
          .labelSmall { color: #6b7280; }
          .valueSmall { overflow-wrap: anywhere; }

          /* Switch at 640px: cards on, table off */
          @media (max-width: 640px) {
            .table { display: none; }
            .cards { display: block; }
          }
        `}</style>
      </main>
    </>
  );
}
