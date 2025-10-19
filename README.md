# Allowance Watch (MVP)

Scan an Ethereum wallet for risky ERC-20 allowances (unlimited/stale), and revoke with one click via your wallet.

> v1 is client-side only: no server and no DB. It checks a curated list of tokens × spenders. You can expand both lists in `/config`.

## Quick start

1. **Install**
   ```bash
   npm i
   ```

2. **Set RPC**
   Copy `.env.example` to `.env.local` and set:
   ```
   NEXT_PUBLIC_ETHEREUM_RPC_URL=YOUR_RPC_URL
   ```
   You can use a public endpoint for dev, but a provider (Alchemy/Infura/etc.) is recommended for reliability.

3. **Run**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

4. **Scan & Revoke**
   - Enter a wallet address and click **Scan**.
   - Connect your wallet (MetaMask) to send `approve(spender, 0)` revokes.

## Configure tokens & spenders

- Edit `/config/tokens.ts` to add ERC-20s (symbol, address, decimals).
- Edit `/config/spenders.ts` to add routers/markets (spender contract addresses).
- **Verify every address from official sources before production.**

## Roadmap (next steps)

- Show current token balances and use them in risk scoring.
- Add more chains (Arbitrum, Optimism, Base).
- Add monitoring/alerts (serverless cron + email/Telegram).
- Add Solana authority-change checks (Helius) in v2.
- Stripe paywall for Pro features.

## Safety

- This app never takes custody of funds.
- Revokes require explicit approval in your wallet.
- Always verify addresses you add to `/config`.
