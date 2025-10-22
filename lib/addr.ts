// lib/addr.ts
import { getAddress } from 'viem';

// Strip invisible chars some mobile keyboards paste
const ZW = /[\u200B\u200C\u200D\uFEFF]/g;
const QUOTES = /[“”‘’"']/g;

/** Return a checksummed EVM address or throw with a human message. */
export function normalizeAddressStrict(input?: string | null): `0x${string}` {
  if (!input) throw new Error('empty address');
  const raw = String(input).replace(ZW, '').replace(QUOTES, '').trim();
  if (!raw.startsWith('0x')) throw new Error('must start with 0x');
  if (!/^0x[0-9a-fA-F]{40}$/.test(raw)) throw new Error('must be 20 bytes (40 hex chars)');
  try {
    return getAddress(raw); // EIP-55 checksummed
  } catch {
    throw new Error('checksum mismatch');
  }
}
