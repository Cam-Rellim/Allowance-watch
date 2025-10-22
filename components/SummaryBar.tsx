import React from 'react';

type SummaryBarProps = {
  findings: any[];          // keep broad for now to avoid type friction
  loading?: boolean;        // optional "Scanning..." state
};

export default function SummaryBar({ findings, loading = false }: SummaryBarProps) {
  const total = findings?.length ?? 0;

  // Best-effort risk buckets if items carry a "risk" field; otherwise 0s.
  const high = findings?.filter((f: any) => f?.risk === 'high').length ?? 0;
  const medium = findings?.filter((f: any) => f?.risk === 'medium').length ?? 0;
  const low = findings?.filter((f: any) => f?.risk === 'low').length ?? 0;

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        padding: '10px 12px',
        border: '1px solid var(--border, rgba(255,255,255,0.08))',
        borderRadius: 10,
        background: 'var(--panel, rgba(255,255,255,0.03))',
      }}
    >
      {loading ? (
        <div style={{ fontWeight: 600, opacity: 0.9 }}>Scanning…</div>
      ) : (
        <>
          <div style={{ fontWeight: 700 }}>{total}</div>
          <div style={{ opacity: 0.8 }}>approvals found</div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, fontSize: 12, opacity: 0.85 }}>
            <span>High: {high}</span>
            <span>Med: {medium}</span>
            <span>Low: {low}</span>
          </div>
        </>
      )}
    </div>
  );
}
