import React from 'react';
import RevokeButton from './RevokeButton';

export type Finding = {
  chain: string;              // e.g. "Base"
  token: string;              // e.g. "USDC"
  spender: string;            // 0x...
  spenderName?: string;
  allowance: string;          // "Unlimited" or pretty number
  chainId?: number;
  tokenAddress?: `0x${string}`;
};

type Props = {
  findings: Finding[];
};

export default function Results({ findings }: Props) {
  if (!findings || findings.length === 0) return null;

  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <table className="table">
        <thead>
          <tr>
            <th>Chain</th>
            <th>Token</th>
            <th>Spender</th>
            <th>Allowance</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {findings.map((f, i) => {
            // Shape the object the way RevokeButton expects (finding: FindingLike)
            const findingLike = {
              chainId: f.chainId,
              tokenAddress: f.tokenAddress,
              spender: f.spender as `0x${string}`,
              tokenSymbol: f.token,   // harmless extra fields if RB uses them
              chainName: f.chain,
            } as any;

            return (
              <tr key={i}>
                <td>{f.chain}</td>
                <td>{f.token}</td>
                <td title={f.spender}>{f.spenderName || `${f.spender.slice(0, 8)}…`}</td>
                <td>{f.allowance}</td>
                <td>
                  <RevokeButton finding={findingLike} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
