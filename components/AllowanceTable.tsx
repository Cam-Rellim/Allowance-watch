import * as React from 'react';

type Row = {
  token: string;
  tokenAddress: string;
  spenderName: string;
  spenderAddress: string;
  allowance: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  suggestion: string;
};

export function AllowanceTable({ rows, onRevoke }: { rows: Row[]; onRevoke: (row: Row) => void }) {
  if (!rows.length) {
    return <div className="empty">No risky approvals found for the configured tokens/spenders.</div>;
  }
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Token</th>
          <th>Spender</th>
          <th>Allowance</th>
          <th>Risk</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td title={r.tokenAddress}>{r.token}</td>
            <td title={r.spenderAddress}>{r.spenderName}</td>
            <td>{r.allowance}</td>
            <td className={r.risk.toLowerCase()}>{r.risk}</td>
            <td><button onClick={() => onRevoke(r)}>Revoke</button></td>
          </tr>
        ))}
      </tbody>
      <style jsx>{`
        .table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; }
        th { background: #f9fafb; }
        .high { color: #b91c1c; font-weight: 600; }
        .medium { color: #a16207; font-weight: 600; }
        .low { color: #065f46; font-weight: 600; }
        button { padding: 6px 12px; border-radius: 8px; border: 1px solid #111827; background: white; cursor: pointer; }
        button:hover { background: #111827; color: white; }
        .empty { margin-top: 12px; color: #6b7280; }
      `}</style>
    </table>
  );
}
