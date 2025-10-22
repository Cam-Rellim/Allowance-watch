// components/Brand.tsx
export default function Brand() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <img src="/favicon.svg" alt="" width={28} height={28} />
      <div>
        <div style={{ fontWeight: 700 }}>CoinIntel Pro</div>
        <div style={{ opacity: 0.65, fontSize: 12 }}>Allowance Watch</div>
      </div>
    </div>
  );
}
