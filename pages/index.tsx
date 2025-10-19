import { useState, useMemo } from "react";
import Head from "next/head";
import { erc20Abi } from "../lib/erc20";
import { getPublicClient } from "../lib/networks";
import { CHAINS, DEFAULT_CHAIN_ID } from "../config/chains";
import { TOKENS_BY_CHAIN, Token } from "../config/tokens";
import { SPENDERS_BY_CHAIN, Spender } from "../config/spenders";
import { formatUnits, isAddress } from "viem";
import { useAccount, useConnect } from "wagmi";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";

type Finding = {
  chainId: number;
  token: Token;
  spender: Spender;
  allowance: string;
  raw: bigint;
};

export default function Home() {
  const [owner, setOwner] = useState<string>("0xfe99f53446cf89ffa36bd0ff12526265e3e7593d");
  const [chainId, setChainId] = useState<number>(DEFAULT_CHAIN_ID);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(false);
  const { address: connectedAddress } = useAccount();
  const { connect, connectors } = useConnect();

  const selectedChain = useMemo(() => CHAINS.find(c => c.id === chainId)!, [chainId]);

  async function scan() {
    if (!isAddress(owner)) {
      alert("Enter a valid wallet address");
      return;
    }
    setLoading(true);
    setFindings([]);

    try {
      const client = getPublicClient(chainId);
      const tokens = TOKENS_BY_CHAIN[chainId] ?? [];
      const spenders = SPENDERS_BY_CHAIN[chainId] ?? [];

      const out: Finding[] = [];
      for (const token of tokens) {
        // decimals to format nicely
        const decimals: number = Number(
          await client.readContract({
            address: token.address,
            abi: erc20Abi,
            functionName: "decimals",
          })
        );

        for (const spender of spenders) {
          const allowance: bigint = await client.readContract({
            address: token.address,
            abi: erc20Abi,
            functionName: "allowance",
            args: [owner as `0x${string}`, spender.address],
          });
          if (allowance > 0n) {
            out.push({
              chainId,
              token,
              spender,
              allowance: formatUnits(allowance, decimals),
              raw: allowance,
            });
          }
        }
      }
      // sort largest first
      out.sort((a, b) => (a.raw > b.raw ? -1 : 1));
      setFindings(out);
    } catch (e: any) {
      console.error(e);
      alert(`Scan failed: ${e?.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }

  async function revoke(row: Finding) {
    // Ensure wallet connected to SAME chain; if not, prompt MetaMask
    if (!connectedAddress) {
      const inj = connectors.find(c => c.id === "metaMask");
      if (inj) await connect({ connector: inj as unknown as MetaMaskConnector });
    }
    alert("For now, open this site in your wallet's in-app browser (MetaMask) and use your wallet UI to revoke the approval for the spender shown.");
  }

  return (
    <>
      <Head>
        <title>Allowance Watch</title>
      </Head>
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "24px" }}>
        <h1 style={{ fontSize: 42, fontWeight: 800, marginBottom: 16 }}>Allowance Watch</h1>
        <p>Scan ERC-20 approvals and flag common high-risk spenders (Uniswap routers & Permit2).</p>

        <label style={{ display: "block", marginTop: 16, fontWeight: 600 }}>Wallet address</label>
        <input
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          style={{ width: "100%", padding: 12, borderRadius: 8, marginTop: 6 }}
          placeholder="0x..."
        />

        <label style={{ display: "block", marginTop: 16, fontWeight: 600 }}>Network</label>
        <select
          value={chainId}
          onChange={(e) => setChainId(Number(e.target.value))}
          style={{ width: "100%", padding: 12, borderRadius: 8, marginTop: 6 }}
        >
          {CHAINS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <button
          onClick={scan}
          disabled={loading}
          style={{
            marginTop: 16,
            padding: "12px 16px",
            borderRadius: 8,
            fontWeight: 700,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Scanning..." : "Scan"}
        </button>

        <div style={{ marginTop: 24 }}>
          {findings.length === 0 ? (
            <p>No approvals > 0 found for the configured tokens/spenders on {selectedChain.name}.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th align="left">Chain</th>
                  <th align="left">Token</th>
                  <th align="left">Spender</th>
                  <th align="right">Allowance</th>
                  <th align="right">Action</th>
                </tr>
              </thead>
              <tbody>
                {findings.map((f, i) => (
                  <tr key={i}>
                    <td>{selectedChain.name}</td>
                    <td>{f.token.symbol}</td>
                    <td title={f.spender.address}>{f.spender.label}</td>
                    <td align="right">{f.allowance}</td>
                    <td align="right">
                      <button onClick={() => revoke(f)}>Revoke</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <h2 style={{ marginTop: 28 }}>Notes</h2>
        <ul>
          <li>Routers & Permit2 addresses are from Uniswap’s official deployment pages.</li>
          <li>USDC addresses are from Circle’s official address list.</li>
          <li>To sign revokes, open this site in your wallet’s in-app browser (MetaMask/Trust) on the same network.</li>
        </ul>
      </main>
    </>
  );
}