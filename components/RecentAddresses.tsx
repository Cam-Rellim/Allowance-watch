import React, { useEffect, useState } from 'react';

type Props = {
  onSelect: (address: string) => void;
  max?: number;
};

export default function RecentAddresses({ onSelect, max = 8 }: Props) {
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('recentAddresses');
      setRecents(raw ? JSON.parse(raw) : []);
    } catch {
      setRecents([]);
    }
  }, []);

  if (!recents.length) return null;

  return (
    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {recents.slice(0, max).map((addr) => (
        <button
          key={addr}
          className="btn"
          style={{
            height: 32,
            padding: '0 10px',
            fontSize: 12,
            background: 'transparent',
            borderStyle: 'dashed',
          }}
          onClick={() => onSelect(addr)}
          title={addr}
        >
          {addr.slice(0, 6)}…{addr.slice(-4)}
        </button>
      ))}
    </div>
  );
}

// helper to push a new address into history (call from page)
export function pushRecentAddress(addr: string) {
  try {
    const raw = localStorage.getItem('recentAddresses');
    const list: string[] = raw ? JSON.parse(raw) : [];
    const next = [addr, ...list.filter((a) => a.toLowerCase() !== addr.toLowerCase())].slice(0, 24);
    localStorage.setItem('recentAddresses', JSON.stringify(next));
  } catch {}
}
