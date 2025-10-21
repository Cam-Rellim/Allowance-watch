import { Address } from 'viem';
import { useAccount, useChainId, useSwitchChain, useWriteContract } from 'wagmi';
import { ERC20_ABI } from '../lib/erc20';

type FindingLike = {
  chainId: number;
  chainName: string;
  tokenSymbol: string;
  tokenAddress: Address;
  spenderLabel: string;
  spenderAddress: Address;
};

export default function RevokeButton({
  finding,
  scannedChecksum,
}: {
  finding: FindingLike;
  scannedChecksum?: Address;
}) {
  const { address } = useAccount();
  const activeChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();

  const connectedChecksum = address as Address | undefined;
  const disabled = !connectedChecksum || !scannedChecksum || connectedChecksum !== scannedChecksum;

  return (
    <button
      className="button subtle"
      disabled={disabled}
      title={disabled ? 'Connect the same wallet you scanned' : 'Revoke allowance'}
      onClick={async () => {
        try {
          if (activeChainId !== finding.chainId) {
            try { await switchChainAsync({ chainId: finding.chainId }); }
            catch { alert(`Please switch wallet to ${finding.chainName}.`); return; }
          }
          const ok = confirm(`Revoke ${finding.tokenSymbol} approval for ${finding.spenderLabel} on ${finding.chainName}?`);
          if (!ok) return;
          await writeContractAsync({
            address: finding.tokenAddress,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [finding.spenderAddress, 0n],
          });
          alert('Transaction sent. After it confirms, press “Scan again” to refresh.');
        } catch (e: any) {
          alert('Revoke failed: ' + (e?.shortMessage || e?.message || String(e)));
        }
      }}
    >
      Revoke
    </button>
  );
}
