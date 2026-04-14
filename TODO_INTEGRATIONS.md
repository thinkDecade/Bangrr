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
- ✅ `agent_memory` DB table with RLS
- ✅ `src/lib/unibase-memory.ts` — full memory layer
- ✅ Agent cycle wired to persist memory after each trade
- ✅ Agent profile page shows Unibase Memory section
- ⬜ Wire real MEMBASE_SECRET_KEY for on-chain identity registration

## 4. 📈 MYX Finance Leverage — ✅ BUILT (simulated protocol)
- ✅ `leveraged_positions` DB table with RLS
- ✅ `open_leveraged_position` + `check_liquidations` DB functions
- ✅ Leverage selector (1×/2×/5×/10×) in TradeActions UI
- ✅ Position management panel in sidebar with P&L, liq warnings
- ⬜ Wire real MYX Finance protocol contracts
- ⬜ Margin/collateral management UI

## 5. ⛩ Appease the Viral Agent Gods — ✅ BUILT
- ✅ `agent_summons` DB table with RLS (user-scoped)
- ✅ `src/lib/summon-functions.ts` — `summonAgent` + `getPostSummons` server functions
- ✅ `src/components/feed/SummonAgent.tsx` — ritual UI with agent picker + amplify/protect/destroy
- ✅ Agents auto-process summons (70% accept rate) and execute trades
- ✅ Activity feed logs summon results (accepted/rejected)
- ✅ Integrated into PostCard for every post

## 6. ⚔️ Agent Wars — ✅ BUILT
- ✅ `agent_wars` + `agent_war_votes` DB tables with RLS
- ✅ `src/lib/agent-wars-functions.ts` — getActiveWars, voteInWar, startAgentWar, resolveAgentWar
- ✅ `src/components/feed/AgentWarCard.tsx` — live war display with VS header, vote buttons, resolve
- ✅ Agent engine auto-starts wars when agents trade opposite on same post
- ✅ Community voting with percentage display
- ✅ War resolution based on price movement direction

## 7. 🎬 Clip Types — ✅ ALL WIRED
- ✅ APE_MOMENT — large buy impact (≥8% or ×5+)
- ✅ ORACLE_CALL — ORACLE trade with ≥6% impact
- ✅ MYTH_DROP — MYTH trade with ≥7% impact or ×8+
- ✅ AGENT_WAR — two agents trade opposite on same post within 60s
- ✅ VOLATILITY_SPIKE — recent price range ≥15% of average

## Remaining Real-Protocol Wiring (post-testnet)
- ⬜ Four.meme real contract signing
- ⬜ Pieverse real facilitator endpoint + EIP-712 wallet signing
- ⬜ Unibase real MEMBASE_SECRET_KEY
- ⬜ MYX Finance real contracts
- ⬜ Early Ape NFT (BEP-721 auto-mint for first APE into 5×+ post)
