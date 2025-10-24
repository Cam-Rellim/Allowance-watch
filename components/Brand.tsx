// components/Brand.tsx
export default function Brand({ subtitle }: { subtitle?: string }) {
  return (
    <div className="brand">
      <img src="/favicon.svg" alt="CoinIntel Pro" width={40} height={40} />
      <div>
        <div className="brand-title">CoinIntel <span>Pro</span></div>
        {subtitle ? <div className="brand-sub">{subtitle}</div> : null}
      </div>
    </div>
  );
}
