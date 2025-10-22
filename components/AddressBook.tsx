import React, { useEffect, useState } from 'react';
import type { AddressEntry } from './SaveAddressButton';

const KEY = 'aw.addressBook';

function load(): AddressEntry[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') as AddressEntry[]; }
  catch { return []; }
}
function saveAll(items: AddressEntry[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(items));
}

export default function AddressBook({ onSelect }: { onSelect: (addr: string) => void }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AddressEntry[]>([]);

  useEffect(() => { if (open) setItems(load()); }, [open]);

  const remove = (addr: string) => {
    const next = items.filter((x) => x.address.toLowerCase() !== addr.toLowerCase());
    setItems(next); saveAll(next);
  };

  return (
    <>
      <button className="btn secondary" onClick={() => setOpen(true)}>Address Book</button>

      {open && (
        <div className="modal" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modalHeader">
              <div style={{ fontWeight: 700 }}>Address Book</div>
              <button className="btn ghost" onClick={() => setOpen(false)}>Close</button>
            </div>

            {items.length === 0 ? (
              <div className="empty">No saved addresses yet.</div>
            ) : (
              <div className="list">
                {items.map((it) => (
                  <div key={it.address} className="rowItem">
                    <div>
                      <div style={{ fontWeight: 600 }}>{it.label}</div>
                      <div className="muted" style={{ fontSize: 13 }}>{short(it.address)}</div>
                    </div>
                    <div className="rowActions">
                      <button className="btn small" onClick={() => { onSelect(it.address); setOpen(false); }}>
                        Use
                      </button>
                      <button className="btn small danger" onClick={() => remove(it.address)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function short(a: string) { return `${a.slice(0, 8)}…${a.slice(-6)}`; }
