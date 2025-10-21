import { useAccount, useConnect, useDisconnect } from 'wagmi';

const short = (a: string) => a.slice(0,6)+'…'+a.slice(-4);

export default function ConnectButton() {
  const { address } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (address) {
    return (
      <div className="themeSel">
        <span>{short(address)}</span>
        <button className="button subtle" onClick={() => disconnect()}>Disconnect</button>
      </div>
    );
  }
  return (
    <button
      className="button"
      onClick={async () => {
        const inj = connectors.find((c) => c.id === 'injected') || connectors[0];
        if (!inj) return alert('No injected wallet found.');
        await connectAsync({ connector: inj });
      }}
    >
      Connect
    </button>
  );
      }
