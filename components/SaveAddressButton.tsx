import React from 'react';

export type AddressEntry = { address: string; label: string; createdAt: number };

const KEY = 'aw.addressBook';

function load(): AddressEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as AddressEntry[];
  } catch {
    return [];
  }
}
function saveAll(items: AddressEntry[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(items));
}

export default function SaveAddressButton({
  address,
  onSaved,
}: {
  address: string;
  onSaved?: (entry: AddressEntry) => void;
}) {
  const onClick = () => {
    if (!address) {
      alert('Enter an address first.');
      return;
    }
    const label = prompt('Save address as (name/label):')?.trim();
    if (!label) return;
    const items = load();
    // de-dup by address (case-insensitive)
    const lower = address.toLowerCase();
    const existing = items.find((x) => x.address.toLowerCase() === lower);
    if (existing) existing.label = label;
    else items.unshift({ address, label, createdAt: Date.now() });
    saveAll(items);
    onSaved?.(items[0]);
  };

  return (
    <button className="btn secondary" onClick={onClick} title="Save to Address Book">
      ★ Save
    </button>
  );
}
