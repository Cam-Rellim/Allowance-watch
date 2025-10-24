import React from 'react';
import RevokeButton from './RevokeButton';

export type Finding = {
  /** Human-readable chain label, e.g. "Base" */
  chain: string;
  /** Token symbol, e.g. "USDC" */
  token: string;
  /** Spender address */
  spender: string;
  /** Optional friendly spender name */
  spenderName?: string;
  /** Pretty-formatted allowance amount (e.g. "1,234.56 USDC" or "Unlimited") */
  allowance: string;

  /** Optional fields some revoke UIs may need */
  chainId?: number;
  tokenAddress?: `0x${string}`;
};

type Props = {
  findings: Finding[];
};

export default function Results({ findings }: Props) {
  if (!findings || findings.length === 0) {
    return null;
  }

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
          {findings.map((f, i) => (
            <tr key={i}>
              <td>{f.chain}</td>
              <td>{f.token}</td>
              <td title={f.spender}>{f.spenderName || `${f.spender.slice(0, 8)}…`}</td>
              <td>{f.allowance}</td>
              <td>
                {/* Pass through optional props only if present to keep types happy */}
                <RevokeButton
                  {...(f.chainId !== undefined ? { chainId: f.chainId } : {})}
                  {...(f.tokenAddress ? { tokenAddress: f.tokenAddress } : {})}
                  spender={f.spender as `0x${string}`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
