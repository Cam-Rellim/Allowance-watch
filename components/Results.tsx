import React from 'react';
import type { Address } from 'viem';
import { useAccount, useWriteContract } from 'wagmi';
import { ERC20_ABI } from '../lib/erc20';

export type Finding = {
  chainId: number;
  chainName: string;
  token: { address: Address; symbol: string; decimals: number };
  spender: { address: Address; name: string };
  allowancePretty: string;
  allowanceRaw: bigint;
  risk: 'high' | 'med' | 'low';
};

export default function Results({ findings }: { findings: Finding[] }) {
  const { isConnected, chain } = useAccount();
  const { writeContractAsync } = useWriteContract();

  async function revoke(f: Finding) {
    try {
      await writeContractAsync({
        abi: ERC20_ABI,
        address: f.token.address,
        functionName: 'approve',
        args: [f.spender.address, 0n],
        chainId: f.chainId,
      });
      alert('Submitted revoke transaction.');
    } catch (e: any) {
      alert(`Revoke failed: ${e?.shortMessage || e?.message || e}`);
    }
  }

  if (findings.length === 0) return null;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table">
        <thead>
          <tr>
            <th>Chain</th>
            <th>Token</th>
            <th>Spender</th>
            <th>Allowance</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {findings.map((f, i) => (
            <tr key={i}>
              <td>{f.chainName}</td>
              <td>{f.token.symbol}</td>
              <td>{f.spender.name}</td>
              <td>{f.allowancePretty}</td>
              <td style={{ textAlign: 'right' }}>
                <button
                  className="btn small"
                  disabled={!isConnected || (chain && chain.id !== f.chainId)}
                  title={!isConnected ? 'Connect wallet' : (chain && chain.id !== f.chainId) ? 'Switch to this chain' : 'Revoke'}
                  onClick={() => revoke(f)}
                >
                  Revoke
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
