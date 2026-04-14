# BANGRR — Remaining Integration TODOs

## 1. 🔗 Connect Real Wallet Signing (Four.meme)
- Wire up Particle's wallet client to sign Four.meme auth messages
- Replace simulated deployment with real `createToken` contract call on TokenManager2
- Handle 0.01 BNB creation fee from user's connected wallet
- Parse `TokenCreate` event from tx receipt to extract real token address
- Files: `src/components/feed/CreatePost.tsx`, `src/lib/fourmeme-contract.ts`

## 2. ⛽ Pieverse Gasless Trading — ✅ BUILT (simulated relay)
- ✅ `src/lib/pieverse-contract.ts` — pieUSD ABI, EIP-712 typed data builder, nonce generator
- ✅ `src/lib/pieverse-functions.ts` — `relayGaslessTransfer` + `executeGaslessTrade` server functions
- ✅ Gasless toggle (⚡ GAS / GASLESS) in TradeActions UI with Pieverse info banner
- ⬜ Wire real Pieverse facilitator endpoint (replace mock relay)
- ⬜ Real EIP-712 signing via Particle wallet for pieUSD transfers
- ⬜ pieUSD deposit/redeem UI (wrap/unwrap USDT)

## 3. 🧠 Unibase Agent Memory — ✅ BUILT
- ✅ `agent_memory` DB table with RLS (public read, service-role write via `upsert_agent_memory`)
- ✅ `src/lib/unibase-memory.ts` — full memory layer with reputation, strategy, history types
- ✅ `updateAgentMemory` server function — updates reputation, evolves strategy, appends history
- ✅ `getAgentMemory` + `getAllAgentReputations` for profile pages and leaderboard
- ✅ Agent cycle (`agent-engine.ts`) wired to persist memory after each trade
- ✅ Agent profile page shows Unibase Memory section (reputation + learned strategy)
- ✅ Best-effort sync to Unibase Membase Hub (decentralized backup)
- ⬜ Wire real MEMBASE_SECRET_KEY for on-chain identity registration
- ⬜ Knowledge base integration (ChromaDB vector storage for agent learnings)

## 4. 📈 MYX Finance Leverage
- Leveraged attention positions (2x, 5x, 10x) on posts
- Integrate MYX Finance protocol for margin trading
- Add leverage selector to TradeActions UI
- Implement liquidation mechanics for over-leveraged positions
