import React from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function ConnectButton() {
  const { address, isConnected, status } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnect = () => {
    // Prefer the injected connector (MetaMask/Rabby/etc.), otherwise first available.
    const preferred =
      connectors.find((c) => c.id === 'injected') ?? connectors[0];

    if (preferred) connect({ connector: preferred });
  };

  if (isConnected && address) {
    return (
      <button
        className="btn"
        onClick={() => disconnect()}
        title={address}
        aria-label="Disconnect"
      >
        {short(address)} · Disconnect
      </button>
    );
  }

  return (
    <button
      className="btn"
      onClick={handleConnect}
      disabled={isPending || status === 'connecting' || connectors.length === 0}
      aria-busy={isPending || status === 'connecting'}
    >
      {isPending || status === 'connecting' ? 'Connecting…' : 'Connect'}
    </button>
  );
}
