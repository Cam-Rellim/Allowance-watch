// components/Results.tsx
import React from 'react';

type Props = {
  /** Your array of scan results (whatever shape you already have). */
  rows: any[];
  /** Pass your loading boolean (e.g., isScanning / loading). */
  loading?: boolean;
  /** Optional revoke handler: (row) => void */
  onRevoke?: (row: any) => void;
};

/** Safely pull display fields from whatever row shape you already use */
function pickDisplay(row: any) {
  const chain =
    row.chainName ?? row.chain ?? row.chain_label ?? row.network ?? '—';
  const token =
    row.token?.symbol ?? row.tokenSymbol ?? row.symbol ?? row.token ?? '—';
  const spender =
    row.spender?.label ?? row.spenderLabel ?? row.spender_name ?? '—';
  const allowancePretty =
    row.allowancePretty ?? row.allowance ?? row.pretty ?? String(row.amount ?? '—');

  const tokenAddr: string | undefined =
    row.token?.address ?? row.tokenAddress ?? row.token_addr ?? row.tokenAddr;
  const spenderAddr: string | undefined =
    row.spender?.address ?? row.spenderAddress ?? row.spender_addr ?? row.spenderAddr;

  return { chain, token, spender, allowancePretty, tokenAddr, spenderAddr };
}

function SkeletonCard() {
  return (
    <div className="card">
      <div className="card-line skeleton" style={{ width: '30%' }} />
      <div className="card-line skeleton" style={{ width: '60%' }} />
      <div className="card-line skeleton" style={{ width: '45%' }} />
      <div className="card-line skeleton" style={{ width: '55%' }} />
    </div>
  );
}

export default function Results({ rows, loading, onRevoke }: Props) {
  // --- Mobile cards ---
  const mobile = (
    <div className="cards">
      {loading ? (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      ) : rows?.length ? (
        rows.map((row, i) => {
          const d = pickDisplay(row);
          return (
            <div className="card" key={i}>
              <div className="card-row">
                <span className="card-k">Chain</span>
                <span className="card-v">{d.chain}</span>
              </div>
              <div className="card-row">
                <span className="card-k">Token</span>
                <span className="card-v mono">
                  {d.token}
                  {d.tokenAddr ? (
                    <>
                      {' '}
                      <a
                        className="muted"
                        target="_blank"
                        rel="noreferrer"
                        href={`https://etherscan.io/address/${d.tokenAddr}`}
                      >
                        ↗
                      </a>
                    </>
                  ) : null}
                </span>
              </div>
              <div className="card-row">
                <span className="card-k">Spender</span>
                <span className="card-v">
                  {d.spender}{' '}
                  {d.spenderAddr ? (
                    <a
                      className="muted"
                      target="_blank"
                      rel="noreferrer"
                      href={`https://etherscan.io/address/${d.spenderAddr}`}
                    >
                      ↗
                    </a>
                  ) : null}
                </span>
              </div>
              <div className="card-row">
                <span className="card-k">Allowance</span>
                <span className="card-v mono">{d.allowancePretty}</span>
              </div>

              {onRevoke ? (
                <div className="card-actions">
                  <button className="btn secondary" onClick={() => onRevoke(row)}>
                    Revoke
                  </button>
                </div>
              ) : null}
            </div>
          );
        })
      ) : (
        <div className="empty">No results yet. Enter a wallet and Scan.</div>
      )}
    </div>
  );

  // --- Desktop table (kept for wide screens) ---
  const desktop = (
    <div className="table-wrap">
      <table className="results-table">
        <thead>
          <tr>
            <th>Chain</th>
            <th>Token</th>
            <th>Spender</th>
            <th>Allowance</th>
            {onRevoke ? <th /> : null}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <>
              {[0, 1, 2].map((i) => (
                <tr key={i}>
                  <td colSpan={onRevoke ? 5 : 4}>
                    <div className="skeleton" style={{ height: 16, width: '100%' }} />
                  </td>
                </tr>
              ))}
            </>
          ) : rows?.length ? (
            rows.map((row, i) => {
              const d = pickDisplay(row);
              return (
                <tr key={i}>
                  <td>{d.chain}</td>
                  <td className="mono">{d.token}</td>
                  <td>{d.spender}</td>
                  <td className="mono">{d.allowancePretty}</td>
                  {onRevoke ? (
                    <td>
                      <button className="btn secondary sm" onClick={() => onRevoke(row)}>
                        Revoke
                      </button>
                    </td>
                  ) : null}
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={onRevoke ? 5 : 4} className="empty">
                No results yet. Enter a wallet and Scan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      {/* mobile-first cards (visible < 768px) */}
      {mobile}
      {/* desktop table (hidden < 768px) */}
      {desktop}
    </>
  );
                                                      }
