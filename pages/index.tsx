import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { getPublicClient } from '../lib/networks';
import { ERC20_ABI } from '../lib/erc20';
import { CHAINS, DEFAULT_CHAIN_ID } from '../config/chains';
import { TOKENS_BY_CHAIN } from '../config/tokens';
import { SPENDERS_BY_CHAIN } from '../config/spenders';
import ConnectButton from '../components/ConnectButton';
import Brand from '../components/Brand';
import SummaryBar from '../components/SummaryBar';
import Results from '../components/Results';
import { normalizeAddressStrict } from '../lib/addr';

// -------------------- Types --------------------

type TokenCfg = { symbol: string; address: string };
type SpenderCfg = { name?: string; address: string };

type Finding = {
  chainId: number;
  chainName: string;
  token: { symbol: string; address: `0x${string}` };
  spender: { name: string; address: `0x${string}` };
  allowanceRaw: bigint;
  allowancePretty: string;
};

type Issue = {
  kind: 'token' | 'spender' | 'call' | 'owner';
  chainId?: number;
  symbol?: string;
  address?: string;
  reason: string;
};

// -------------------- Helpers --------------------

function prettyAmountFloat(x: number): string {
  if (!isFinite(x)) return '∞';
  if (x === 0) return '0';
  const abs = Math.abs(x);
  if (abs >= 1_000_000_000) return (x / 1_000_000_000).toFixed(2) + 'B';
  if (abs >= 1_000_000) return (x / 1_000_000).toFixed(2) + 'M';
  if (abs >= 1_000) return (x / 1_000).toFixed(2) + 'k';
  if (abs < 0.000001) return x.toExponential(2);
  return x.toFixed(abs < 1 ? 6 : 4).replace(/\.?0+$/, '');
}

function bigintToFloat(n: bigint, decimals: number): number {
  // Avoid precision issues for huge numbers by splitting
  const d = BigInt(decimals);
  const base = 10n ** d;
  const whole = Number(n / base);
  const frac = Number(n % base) / Number(base);
  return whole + frac;
}

// -------------------- Component --------------------

export default function Home() {
  const { address: connectedAddress } = useAccount();

  const chainList = useMemo(
    () => Object.values(CHAINS).map((c) => ({ id: c.id, name: c.name })),
    []
  );

  const [addressInput, setAddressInput] = useState<string>('');
  const [selectedChain, setSelectedChain] = useState<number>(DEFAULT_CHAIN_ID);
  const [scanAll, setScanAll] = useState<boolean>(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [findings, setFindings] = useState<Finding[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);

  // Prefill recent address (optional UX nicety)
  useEffect(() => {
    const recent = localStorage.getItem('aw_recent');
    if (recent && !addressInput) setAddressInput(recent);
  }, []); // eslint-disable-line

  function rememberRecent(addr: string) {
    try {
      localStorage.setItem('aw_recent', addr);
    } catch {}
  }

  async function scan() {
    setLoading(true);
    setErrorMsg(null);
    setFindings([]);
    setIssues([]);

    const collectedIssues: Issue[] = [];
    let owner: `0x${string}` | null = null;

    // 1) Normalize owner (input wins; else connected)
    try {
      if (addressInput && addressInput.trim()) {
        owner = normalizeAddressStrict(addressInput);
      } else if (connectedAddress) {
        owner = normalizeAddressStrict(connectedAddress);
        setAddressInput(owner);
      } else {
        collectedIssues.push({ kind: 'owner', reason: 'Please enter or connect a wallet address.' });
      }
    } catch (e: any) {
      collectedIssues.push({ kind: 'owner', reason: `Address error: ${String(e?.message || e)}` });
    }

    if (!owner) {
      setIssues(collectedIssues);
      setLoading(false);
      setErrorMsg('Please enter a valid EVM address.');
      return;
    }

    rememberRecent(owner);

    // 2) Decide which chains to scan
    const scanChainIds = scanAll ? chainList.map((c) => c.id) : [selectedChain];

    const allFindings: Finding[] = [];

    // 3) For each chain → tokens × spenders
    for (const chainId of scanChainIds) {
      const chainMeta = CHAINS[chainId];
      if (!chainMeta) continue;

      const client = getPublicClient(chainId);
      const tokens: TokenCfg[] = (TOKENS_BY_CHAIN as any)[chainId] || [];
      const spenders: SpenderCfg[] = (SPENDERS_BY_CHAIN as any)[chainId] || [];

      for (const token of tokens) {
        let tokenAddr: `0x${string}` | null = null;
        try {
          tokenAddr = normalizeAddressStrict(token.address);
        } catch (e: any) {
          collectedIssues.push({
            kind: 'token',
            chainId,
            symbol: token.symbol,
            address: token.address,
            reason: String(e?.message || e),
          });
          continue;
        }

        // Try decimals, default to 18 if call fails (but record the issue)
        let decimals = 18;
        try {
          const dec = await client.readContract({
            address: tokenAddr,
            abi: ERC20_ABI,
            functionName: 'decimals',
          });
          if (typeof dec === 'number') decimals = dec;
        } catch (e: any) {
          collectedIssues.push({
            kind: 'call',
            chainId,
            symbol: token.symbol,
            address: tokenAddr,
            reason: 'decimals() failed: ' + (e?.message || e),
          });
        }

        for (const spender of spenders) {
          let spenderAddr: `0x${string}` | null = null;
          try {
            spenderAddr = normalizeAddressStrict(spender.address);
          } catch (e: any) {
            collectedIssues.push({
              kind: 'spender',
              chainId,
              address: spender.address,
              reason: String(e?.message || e),
            });
            continue;
          }

          try {
            const allowance = (await client.readContract({
              address: tokenAddr,
              abi: ERC20_ABI,
              functionName: 'allowance',
              args: [owner, spenderAddr],
            })) as bigint;

            if (allowance > 0n) {
              const asFloat = bigintToFloat(allowance, decimals);
              allFindings.push({
                chainId,
                chainName: chainMeta.name,
                token: { symbol: token.symbol, address: tokenAddr },
                spender: { name: spender.name || 'Spender', address: spenderAddr },
                allowanceRaw: allowance,
                allowancePretty: prettyAmountFloat(asFloat) + ' ' + token.symbol,
              });
            }
          } catch (e: any) {
            collectedIssues.push({
              kind: 'call',
              chainId,
              symbol: token.symbol,
              address: tokenAddr,
              reason: 'allowance() failed: ' + (e?.message || e),
            });
          }
        }
      }
    }

    // 4) Sort and show
    allFindings.sort((a, b) => a.chainId - b.chainId || a.token.symbol.localeCompare(b.token.symbol));
    setFindings(allFindings);
    setIssues(collectedIssues);
    setLoading(false);
  }

  // -------------------- UI --------------------

  return (
    <>
      <Head>
        <title>Allowance Watch</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="wrap" style={{ paddingTop: 18 }}>
        {/* Header */}
        <div className="row" style={{ alignItems: 'center', gap: 12 }}>
          <div className="col">
            <Brand subtitle="Allowance Watch" />
          </div>
          <div>
            <ConnectButton />
          </div>
        </div>

        <p style={{ marginTop: 8, opacity: 0.9 }}>
          Scan ERC-20 allowances across Base, Arbitrum, BNB, Avalanche, Polygon, Optimism, and Ethereum.
          Revoke directly from results.
        </p>

        {/* Address + Controls */}
        <div className="card" style={{ marginTop: 14 }}>
          <div className="row" style={{ gap: 12, alignItems: 'center' }}>
            <div className="col">
              <label className="label">Wallet address</label>
              <input
                className="input"
                inputMode="text"
                placeholder="0x…"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
              />
            </div>

            <div className="col" style={{ maxWidth: 180 }}>
              <label className="label">Chain</label>
              <select
                className="input"
                disabled={scanAll}
                value={selectedChain}
                onChange={(e) => setSelectedChain(Number(e.target.value))}
              >
                {chainList.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="col" style={{ maxWidth: 160 }}>
              <label className="label">&nbsp;</label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={scanAll}
                  onChange={(e) => setScanAll(e.target.checked)}
                />
                <span style={{ marginLeft: 8 }}>Scan all chains</span>
              </label>
            </div>

            <div>
              <label className="label">&nbsp;</label>
              <button className="btn" onClick={scan} disabled={loading}>
                {loading ? 'Scanning…' : 'Scan'}
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="alert" role="alert" style={{ marginTop: 12 }}>
            {errorMsg}
          </div>
        )}

        {/* Issues panel */}
        {issues.length > 0 && (
          <div className="alert warn" role="alert" style={{ marginTop: 12 }}>
            <strong>Scan issues ({issues.length})</strong>
            <ul style={{ marginTop: 6, paddingLeft: 18 }}>
              {issues.map((it, i) => (
                <li key={i}>
                  {it.chainId ? `[${it.chainId}] ` : ''}
                  {it.kind === 'token' ? 'Token' : it.kind === 'spender' ? 'Spender' : it.kind === 'call' ? 'Call' : 'Owner'}:
                  {it.symbol ? ` ${it.symbol}` : ''}{' '}
                  {it.address ? <code>{it.address}</code> : null} — {it.reason}
                </li>
              ))}
            </ul>
            <div style={{ opacity: 0.8, marginTop: 6 }}>
              Skipped the above while scanning so you still get results. Fix addresses in
              <code> config/tokens.ts </code> or <code> config/spenders.ts</code>.
            </div>
          </div>
        )}

        {/* Summary + Results */}
        <div style={{ marginTop: 14 }}>
          <SummaryBar findings={findings} loading={loading} />
          <Results findings={findings} />
        </div>
      </main>
    </>
  );
      }
