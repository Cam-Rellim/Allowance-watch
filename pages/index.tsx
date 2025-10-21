import { useMemo, useState } from 'react';
import Head from 'next/head';
import { isAddress, formatUnits, type Address, getAddress } from 'viem';
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
  allowance: string;
};

type Status = 'idle' | 'scanning' | 'done';

// helpers
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const norm = (a: string): Address => getAddress(a as `0x${string}`);

export default function Home() {
  const [owner, setOwner] = useState<string>('');
  const [chainId, setChainId] = useState<number>(DEFAULT_CHAIN_ID);
  const [scanAll, setScanAll] = useState<boolean>(true); // default: scan across all chains
  const [status, setStatus] = useState<Status>('idle');
  const [findings, setFindings] = useState<Finding[]>([]);

  const selectedChain = useMemo(() => CHAINS.find(c => c.id === chainId)!, [chainId]);

  async function scan() {
    const input = owner.trim();
    if (!isAddress(input as Address)) {
      alert('Please enter a valid EVM address.');
      return;
    }
    const ownerAddr = getAddress(input as `0x${string}`);

    setStatus('scanning');
    setFindings([]);

    const chainIds = scanAll ? CHAINS.map(c => c.id) : [chainId];
    const out: Finding[] = [];

    try {
      for (const cid of chainIds) {
        const chain = CHAINS.find(c => c.id === cid)!;
        const client = getPublicClient(cid);
        const tokens = TOKENS_BY_CHAIN[cid] ?? [];
        const spenders = SPENDERS_BY_CHAIN[cid] ?? [];

        for (const token of tokens) {
          // Batch decimals + all spender allowances using on-chain multicall
          const calls = [
            { address: norm(token.address), abi: ERC20_ABI, functionName: 'decimals' as const },
            ...spenders.map(sp => ({
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
              out.push({
                chainId: cid,
                chainName: chain.name,
                tokenSymbol: token.symbol,
                tokenAddress: norm(token.address),
                spenderLabel: sp.label,
                spenderAddress: norm(sp.address),
                allowance: `${formatUnits(allowance, decimals)} ${token.symbol}`,
              });
            }
          }

          // Short pause helps with strict public RPCs
          await sleep(75);
        }
      }
      // Sort for stable, readable output
      setFindings(out.sort((a, b) =>
        a.chainName.localeCompare(b.chainName) || a.tokenSymbol.localeCompare(b.tokenSymbol)
      ));
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (msg.includes('429')) {
        alert('Scan failed: Public RPC rate limit (429). Try again shortly or set a custom RPC in settings.');
      } else {
        alert('Scan failed: ' + msg);
      }
    } finally {
      setStatus('done');
    }
  }

  const buttonLabel =
    status === 'scanning' ? 'Scanning…' :
    status === 'done' ? 'Scan again' :
    'Scan';

  return (
    <>
      <Head><title>Allowance Watch</title></Head>
      <main style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
        <h1>Allowance Watch</h1>
        <p>Scan ERC-20 allowances across Base, Arbitrum, BNB, Avalanche, and Ethereum.</p>

        <label htmlFor="owner">Wallet address</label>
        <input
          id="owner"
          placeholder="0x..."
          value={owner}
          onChange={e => { setOwner(e.target.value); if (status === 'done') setStatus('idle'); }}
          onKeyDown={(e) => { if (e.key === 'Enter' && status !== 'scanning') scan(); }}
          style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 16 }}
        />

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
          <select
            value={chainId}
            onChange={e => setChainId(Number(e.target.value))}
            disabled={scanAll}
            title={scanAll ? 'Disable "Scan all chains" to pick a single network' : 'Choose network to scan'}
            style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', opacity: scanAll ? 0.5 : 1 }}
          >
            {CHAINS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
            <input type="checkbox" checked={scanAll} onChange={e => setScanAll(e.target.checked)} />
            Scan all chains
          </label>

          <button
            onClick={scan}
            disabled={status === 'scanning'}
            style={{ marginLeft: 'auto', padding: '10px 14px', borderRadius: 10, border: '1px solid #111827', background: status === 'scanning' ? '#e5e7eb' : 'white' }}
          >
            {buttonLabel}
          </button>
        </div>

        {/* Results area */}
        <section style={{ marginTop: 16 }}>
          {status === 'idle' && (
            <div style={{ color: '#6b7280' }}>Enter a wallet and press Scan.</div>
          )}

          {status === 'scanning' && (
            <div style={{ color: '#6b7280' }}>Scanning… this may take a few seconds.</div>
          )}

          {status === 'done' && findings.length === 0 && (
            <div className="empty">No approvals &gt; 0 found for the configured tokens/spenders.</div>
          )}

          {status === 'done' && findings.length > 0 && (
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
                {findings.map((f, i) => (
                  <tr key={i}>
                    <td>{f.chainName}</td>
                    <td title={f.tokenAddress}>{f.tokenSymbol}</td>
                    <td title={f.spenderAddress}>{f.spenderLabel}</td>
                    <td>{f.allowance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <style jsx>{`
          .table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; }
          th { background: #f9fafb; }
          .empty { margin-top: 12px; color: #6b7280; }
        `}</style>
      </main>
    </>
  );
                         }
