import { useMemo, useState } from 'react';
import Head from 'next/head';
import { isAddress, formatUnits, type Address } from 'viem';
import { useAccount, useConnect, useWriteContract } from 'wagmi';
import { getPublicClient } from '../lib/networks';
import { ERC20_ABI } from '../lib/erc20';
import { TOKENS } from '../config/tokens';
import { SPENDERS } from '../config/spenders';
import { AllowanceTable } from '../components/AllowanceTable';

const MAX_UINT256 = (2n ** 256n) - 1n;

type Finding = {
  token: string;
  tokenAddress: Address;
  spenderName: string;
  spenderAddress: Address;
  allowance: bigint;
  decimals: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  suggestion: string;
};

function classifyRisk(allowance: bigint, decimals: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (allowance === 0n) return 'LOW';
  if (allowance > MAX_UINT256 - 1000n) return 'HIGH'; // effectively unlimited
  const unit = 10n ** BigInt(decimals);
  if (allowance > unit * 1000n) return 'HIGH';
  if (allowance > unit * 10n) return 'MEDIUM';
  return 'LOW';
}

export default function Home() {
  const [owner, setOwner] = useState('');
  const [loading, setLoading] = useState(false);
  const [findings, setFindings] = useState<Finding[]>([]);

  const { address: connectedAddress } = useAccount();
  const { connectors, connect } = useConnect();
  const { writeContractAsync } = useWriteContract();

  const publicClient = useMemo(() => getPublicClient('ethereum'), []);

  async function scan() {
    setFindings([]);
    const ownerAddr = owner.trim() as Address;
    if (!isAddress(ownerAddr)) {
      alert('Please enter a valid EVM address.');
      return;
    }
    setLoading(true);
    try {
      const results: Finding[] = [];
      for (const token of TOKENS) {
        const [decimals, symbol] = await Promise.all([
          publicClient.readContract({
            address: token.address as Address,
            abi: ERC20_ABI,
            functionName: 'decimals',
            args: [],
          }) as Promise<number>,
          publicClient.readContract({
            address: token.address as Address,
            abi: ERC20_ABI,
            functionName: 'symbol',
            args: [],
          }) as Promise<string>,
        ]);

        const allowances = await Promise.all(
          SPENDERS.map(spender =>
            publicClient.readContract({
              address: token.address as Address,
              abi: ERC20_ABI,
              functionName: 'allowance',
              args: [ownerAddr, spender.address as Address],
            }) as Promise<bigint>
          )
        );

        allowances.forEach((allowance, i) => {
          if (allowance > 0n) {
            const spender = SPENDERS[i];
            const risk = classifyRisk(allowance, decimals);
            const suggestion =
              risk === 'HIGH' ? 'Revoke or reduce to exact need.' :
              risk === 'MEDIUM' ? 'Consider reducing to a tighter cap.' :
              'OK';
            results.push({
              token: symbol,
              tokenAddress: token.address as Address,
              spenderName: spender.name,
              spenderAddress: spender.address as Address,
              allowance,
              decimals,
              risk,
              suggestion
            });
          }
        });
      }
      setFindings(results);
    } finally {
      setLoading(false);
    }
  }

  async function revoke(row: Finding) {
    // Ensure a connector is available and connect if needed (Injected / MetaMask)
    const connector = connectors.find(c => c.id === 'injected') ?? connectors[0];
    if (connector && !connectedAddress) {
      await connect({ connector });
    }
    try {
      await writeContractAsync({
        address: row.tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [row.spenderAddress, 0n],
      });
      alert('Revoke transaction sent. It may take a moment to confirm.');
    } catch (e: any) {
      alert('Failed to send revoke: ' + (e?.message || String(e)));
    }
  }

  return (
    <>
      <Head><title>Allowance Watch</title></Head>
      <main style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
        <h1>Allowance Watch</h1>
        <p>Scan your wallet for risky ERC-20 approvals (Ethereum). You control revokes via your wallet.</p>

        <label htmlFor="owner">Wallet address</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            id="owner"
            placeholder="0x..."
            value={owner}
            onChange={e => setOwner(e.target.value)}
            style={{ flex: 1, padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 16 }}
          />
          <button
            onClick={scan}
            disabled={loading}
            style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid #111827', background: loading ? '#e5e7eb' : 'white' }}
          >
            {loading ? 'Scanning…' : 'Scan'}
          </button>
        </div>

        <div style={{ marginTop: 12, fontSize: 12, color: '#6b7280' }}>
          Tokens checked: {TOKENS.map(t => t.symbol).join(', ')} · Spenders: {SPENDERS.map(s => s.name).join(', ') || 'none set'}
        </div>

        <section style={{ marginTop: 16 }}>
          <AllowanceTable
            rows={findings.map(f => ({
              token: f.token,
              tokenAddress: f.tokenAddress,
              spenderName: f.spenderName,
              spenderAddress: f.spenderAddress,
              allowance: `${formatUnits(f.allowance, f.decimals)} ${f.token}`,
              risk: f.risk,
              suggestion: f.suggestion
            }))}
            onRevoke={(r) => {
              const match = findings.find(f =>
                f.token === r.token &&
                f.spenderAddress.toLowerCase() === r.spenderAddress.toLowerCase()
              );
              if (match) revoke(match);
            }}
          />
        </section>

        <section style={{ marginTop: 24 }}>
          <h3>Notes</h3>
          <ul>
            <li>Start with the pre-filled tokens; add more in <code>/config/*.ts</code> (verify from official docs).</li>
            <li>Risk levels are heuristics. Always double-check before revoking.</li>
            <li>On mobile, open this site inside your wallet’s in-app browser (MetaMask) to sign revokes.</li>
          </ul>
        </section>
      </main>
    </>
  );
            }
