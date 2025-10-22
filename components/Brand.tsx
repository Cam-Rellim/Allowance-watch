import React from 'react';

type BrandProps = {
  /** Small line under the product name, e.g. "Allowance Watch" */
  subtitle?: string;
};

export default function Brand({ subtitle }: BrandProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {/* favicon doubles as a tiny logo */}
      <img
        src="/favicon.svg"
        alt=""
        width={28}
        height={28}
        style={{ display: 'block' }}
      />
      <div>
        <div style={{ fontWeight: 800, letterSpacing: 0.2 }}>
          CoinIntel <span style={{ opacity: 0.8, fontWeight: 700 }}>Pro</span>
        </div>
        {subtitle ? (
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>
            {subtitle}
          </div>
        ) : null}
      </div>
    </div>
  );
}
