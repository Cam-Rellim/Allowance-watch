import React, { useMemo } from 'react';

// Reuse the Finding type exported from Results to avoid drift.
// We extend it with an optional 'risk' so either shape compiles.
import type { Finding as ResultsFinding } from './Results';

type RiskLevel = 'high' | 'medium' | 'low' | 'info';
type Finding = ResultsFinding & { risk?: RiskLevel };

function inferRisk(f: ResultsFinding): RiskLevel {
  // Heuristic: "Unlimited" is high; any positive non-unlimited is medium;
  // otherwise info. You can refine later with a real ruleset.
  if (f.allowance === 'Unlimited') return 'high';
  // Try parse number at start of allowance string (e.g., "12.3 USDC")
  const first = f.allowance.split(' ')[0];
  const val = Number(first);
  if (Number.isFinite(val) && val > 0) return 'medium';
  return 'info';
}

export default function SummaryBar({
  findings,
  loading,
}: {
  findings: Finding[];
  loading?: boolean;
}) {
  const stats = useMemo(() => {
    const total = findings.length;
    let unlimited = 0;
    let high = 0, medium = 0, low = 0, info = 0;

    for (const f of findings) {
      if (f.allowance === 'Unlimited') unlimited++;

      const r: RiskLevel = f.risk ?? inferRisk(f);
      if (r === 'high') high++;
      else if (r === 'medium') medium++;
      else if (r === 'low') low++;
      else info++;
    }

    return { total, unlimited, high, medium, low, info };
  }, [findings]);

  return (
    <div className="card" style={{ display: 'flex', gap: 12 }}>
      <div className="stat">
        <div className="stat-label">Approvals</div>
        <div className="stat-value">{loading ? '…' : stats.total}</div>
      </div>
      <div className="stat">
        <div className="stat-label">Unlimited</div>
        <div className="stat-value">{loading ? '…' : stats.unlimited}</div>
      </div>
      <div className="stat">
        <div className="stat-label">High</div>
        <div className="stat-value">{loading ? '…' : stats.high}</div>
      </div>
      <div className="stat">
        <div className="stat-label">Medium</div>
        <div className="stat-value">{loading ? '…' : stats.medium}</div>
      </div>
      <div className="stat">
        <div className="stat-label">Low</div>
        <div className="stat-value">{loading ? '…' : stats.low}</div>
      </div>
      <div className="stat">
        <div className="stat-label">Info</div>
        <div className="stat-value">{loading ? '…' : stats.info}</div>
      </div>
    </div>
  );
}
