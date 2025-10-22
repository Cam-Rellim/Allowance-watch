import React from 'react';

export default function Brand({ subtitle }: { subtitle?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <img
        src="/favicon.svg"
        alt="CoinIntel Pro"
        width={40}
        height={40}
        style={{ display: 'block' }}
      />
      <div>
        <div style={{ lineHeight: 1 }}>
          <span style={{ fontWeight: 800, fontSize: 22 }}>CoinIntel</span>{' '}
          <span
            style={{
              fontWeight: 800,
              fontSize: 22,
              background:
                'linear-gradient(90deg, #8ab4ff 0%, #c1d4ff 45%, #ffffff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Pro
          </span>
        </div>
        {subtitle ? (
          <div style={{ opacity: 0.75, marginTop: 2, fontSize: 13 }}>{subtitle}</div>
        ) : null}
      </div>
    </div>
  );
}
