// lib/addr.ts
import { getAddress, isAddress } from 'viem';
import { getPublicClient } from './networks';

/** Resolve ENS on mainnet; checksum EVM addresses; throw on invalid. */
export async function normalizeInputToAddressOrEns(input: string): Promise<`0x${string}`> {
  const value = (input || '').trim();
  if (!value) throw new Error('Empty address/ENS.');

  // ENS-like?
  if (value.includes('.')) {
    const mainnet = getPublicClient(1);
    const resolved = await mainnet.getEnsAddress({ name: value }).catch(() => null);
    if (!resolved) throw new Error(`ENS not found: ${value}`);
    return getAddress(resolved);
  }

  // Hex address
  if (!value.startsWith('0x') || value.length !== 42 || !isAddress(value)) {
    throw new Error(
      'Address must be a checksummed 0x… value with 40 hex chars (20 bytes), or a valid ENS.'
    );
  }
  return getAddress(value);
}
