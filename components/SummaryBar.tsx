import React from 'react';

export type Finding = {
  risk: 'high' | 'med' | 'low';
};

export default function SummaryBar({ findings, loading }: { findings: Finding[]; loading: boolean }) {
  const total = findings.length;
  const high = findings.filter((f) => f.risk === 'high').length;
  const med  = findings.filter((f) => f.risk === 'med').length;
  const low  = findings.filter((f) => f.risk === 'low').length;

  return (
    <div className="summaryBar">
      <div>{loading ? 'Scanning…' : `${total} approvals found`}</div>
      <div>High: {high} &nbsp; Med: {med} &nbsp; Low: {low}</div>
    </div>
  );
}
