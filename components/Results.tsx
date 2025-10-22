import React from 'react';

type Finding = {
  chainId: number;
  chainName: string;
  token: { symbol: string; address: `0x${string}` };
  spender: { name: string; address: `0x${string}` };
  allowanceRaw: bigint;
  allowancePretty: string;
};

type ResultsProps = {
  findings: Finding[];
};

const EXPLORER_BY_CHAIN: Record<number, string> = {
  1: 'https://etherscan.io',
  8453: 'https://basescan.org',
  42161: 'https://arbiscan.io',
  56: 'https://bscscan.com',
  43114: 'https://snowtrace.io',
  137: 'https://polygonscan.com',
  10: 'https://optimistic.etherscan.io',
};

export default function Results({ findings }: ResultsProps) {
  if (!findings || findings.length === 0) {
    return null; // index.tsx already shows the empty-state / summary
  }

  // Group by chain for nicer layout
  const byChain = groupBy(findings, (f) => f.chainId);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {Object.entries(byChain).map(([cid, items]) => {
        const chainId = Number(cid);
        const chainName = items[0]?.chainName ?? `Chain ${cid}`;
        const explorer = EXPLORER_BY_CHAIN[chainId] || 'https://etherscan.io';

        return (
          <section key={cid} style={{ border: '1px solid var(--border, rgba(255,255,255,0.08))', borderRadius: 12 }}>
            <header style={{ padding: '10px 12px', fontWeight: 700, borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))' }}>
              {chainName}
            </header>

            {/* Mobile cards */}
            <div className="cards" style={{ display: 'grid', gap: 10, padding: 12 }}>
              {items.map((row, i) => (
                <article
                  key={i}
                  className="card"
                  style={{
                    border: '1px solid var(--border, rgba(255,255,255,0.08))',
                    borderRadius: 10,
                    padding: 12,
                    display: 'grid',
                    gap: 8,
                    background: 'var(--panel, rgba(255,255,255,0.02))',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                    <div style={{ fontWeight: 700 }}>
                      {row.token.symbol}
                    </div>
                    <div style={{ opacity: 0.85 }}>{row.allowancePretty}</div>
                  </div>

                  <div style={{ display: 'grid', gap: 6, fontSize: 13, opacity: 0.9 }}>
                    <Field label="Token">
                      <a
                        href={`${explorer}/address/${row.token.address}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {short(row.token.address)}
                      </a>
                    </Field>

                    <Field label="Spender">
                      <a
                        href={`${explorer}/address/${row.spender.address}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {row.spender.name || 'Spender'} — {short(row.spender.address)}
                      </a>
                    </Field>
                  </div>
                </article>
              ))}
            </div>

            {/* Desktop table */}
            <div className="tableWrap" style={{ overflowX: 'auto', padding: '0 12px 12px' }}>
              <table
                className="table"
                style={{
                  width: '100%',
                  borderCollapse: 'separate',
                  borderSpacing: 0,
                  fontSize: 14,
                }}
              >
                <thead>
                  <tr>
                    <Th>Token</Th>
                    <Th>Spender</Th>
                    <Th style={{ textAlign: 'right' }}>Allowance</Th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row, i) => (
                    <tr key={`t-${i}`}>
                      <Td>
                        <a
                          href={`${explorer}/address/${row.token.address}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {row.token.symbol}
                        </a>{' '}
                        <span style={{ opacity: 0.65 }}>{short(row.token.address)}</span>
                      </Td>
                      <Td>
                        <a
                          href={`${explorer}/address/${row.spender.address}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {row.spender.name || 'Spender'}
                        </a>{' '}
                        <span style={{ opacity: 0.65 }}>{short(row.spender.address)}</span>
                      </Td>
                      <Td style={{ textAlign: 'right' }}>
                        {row.allowancePretty}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function groupBy<T, K extends string | number>(arr: T[], keyFn: (t: T) => K): Record<K, T[]> {
  return arr.reduce((acc, it) => {
    const k = keyFn(it);
    (acc[k] ||= []).push(it);
    return acc;
  }, {} as Record<K, T[]>);
}

function Th(props: React.HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...props}
      style={{
        textAlign: 'left',
        padding: '10px 12px',
        borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
        whiteSpace: 'nowrap',
        ...(props.style || {}),
      }}
    />
  );
}

function Td(props: React.HTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      {...props}
      style={{
        padding: '10px 12px',
        borderBottom: '1px solid var(--border, rgba(255,255,255,0.06))',
        verticalAlign: 'top',
        ...(props.style || {}),
      }}
    />
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '88px 1fr', gap: 8 }}>
      <div style={{ opacity: 0.65 }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}
