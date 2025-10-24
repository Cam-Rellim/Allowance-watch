// components/Results.tsx
import type { Finding } from './SummaryBar';

export default function Results({ findings }: { findings: Finding[] }) {
  if (!findings.length) return null;
  return (
    <div className="card">
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
              <td>{f.chain}</td>
              <td>{f.token}</td>
              <td title={f.spender}>{f.spenderName || f.spender.slice(0, 8) + '…'}</td>
              <td>{f.allowance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
