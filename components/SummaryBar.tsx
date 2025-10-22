// components/SummaryBar.tsx
type Finding = {
  chainId: number;
  allowanceRaw?: bigint;
};

export default function SummaryBar({ findings }: { findings: Finding[] }) {
  if (!findings?.length) return null;
  const chains = new Set(findings.map(f => f.chainId)).size;
  const total = findings.length;
  const unlimited = findings.filter(f => (f.allowanceRaw ?? 0n) >= (2n ** 255n)).length;

  return (
    <div style={{
      display: 'flex', gap: 12, margin: '12px 0',
      border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 10
    }}>
      <Stat n={total} label="Approvals" />
      <Stat n={unlimited} label="Unlimited" />
      <Stat n={chains} label="Chains" />
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div style={{ minWidth: 88 }}>
      <div style={{ fontWeight: 700 }}>{n}</div>
      <div style={{ opacity: 0.7, fontSize: 12 }}>{label}</div>
    </div>
  );
}
