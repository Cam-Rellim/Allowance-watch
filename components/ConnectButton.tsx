// components/ConnectButton.tsx
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

export default function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect({ connector: injected() });
  const { disconnect } = useDisconnect();

  if (isConnected)
    return (
      <button className="btn" onClick={() => disconnect()}>
        {address?.slice(0, 6)}…{address?.slice(-4)} &nbsp; Disconnect
      </button>
    );

  return (
    <button className="btn" onClick={() => connect()} disabled={isPending}>
      Connect
    </button>
  );
}
