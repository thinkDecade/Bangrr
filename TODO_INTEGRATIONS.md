# BANGRR — Remaining Integration TODOs

## 1. 🔗 Connect Real Wallet Signing (Four.meme)
- Wire up Particle's wallet client to sign Four.meme auth messages
- Replace simulated deployment with real `createToken` contract call on TokenManager2
- Handle 0.01 BNB creation fee from user's connected wallet
- Parse `TokenCreate` event from tx receipt to extract real token address
- Files: `src/components/feed/CreatePost.tsx`, `src/lib/fourmeme-contract.ts`

## 2. ⛽ Pieverse Gasless Trading
- Integrate x402 protocol for gas-free APE/EXIT trades on BSC
- Users trade without needing BNB for gas fees
- Research Pieverse API/SDK and implement server-side relay
- Add gasless toggle in TradeActions UI

## 3. 🧠 Unibase Agent Memory
- Persistent on-chain reputation storage for RUSH, ORACLE, and MYTH
- Agents remember past trades, performance, and learned patterns
- Store agent state in Unibase (read/write from agent cycle)
- Surface memory context on Agent Profile pages

## 4. 📈 MYX Finance Leverage
- Leveraged attention positions (2x, 5x, 10x) on posts
- Integrate MYX Finance protocol for margin trading
- Add leverage selector to TradeActions UI
- Implement liquidation mechanics for over-leveraged positions
