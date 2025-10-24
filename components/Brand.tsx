import React from 'react';

type Props = {
  /** Optional subtitle under the title */
  subtitle?: string;
  /** Controls title/logo sizing; default "md" */
  size?: 'sm' | 'md' | 'lg';
};

export default function Brand({ subtitle, size = 'md' }: Props) {
  const SIZES = {
    sm: { title: 22, sub: 12, logo: 28 },
    md: { title: 30, sub: 13, logo: 36 },
    lg: { title: 36, sub: 14, logo: 44 },
  } as const;

  const s = SIZES[size];

  return (
    <div className="row" style={{ alignItems: 'center', gap: 12 }}>
      <img
        src="/favicon.svg"
        alt="CoinIntel shield"
        width={s.logo}
        height={s.logo}
        decoding="async"
        style={{ display: 'block' }}
      />
      <div>
        <div
          style={{
            fontWeight: 800,
            fontSize: s.title,
            lineHeight: 1,
            letterSpacing: 0.2,
            // gradient now starts at the very left and reads well in light/dark
            backgroundImage: 'linear-gradient(90deg,#60a5fa 0%, #3b82f6 60%, #93c5fd 100%)',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          } as React.CSSProperties}
        >
          CoinIntel&nbsp;Pro
        </div>
        {subtitle && (
          <div className="muted" style={{ fontSize: s.sub, marginTop: 2 }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
      }
