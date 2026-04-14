

# 🧨 BANGRRR — Revised Build Plan (v2)

## What Changed
- **Visual direction**: Bright chaotic futurism (NOT dark minimal) — neon colors on deep animated gradient backgrounds
- **New feature: Clip System** — virality engine where moments become shareable "attention weapons"
- **New feature: Rotation Engine** — swap attention between assets (DEX for attention)
- **New feature: BNB Chain + Four.meme** — real testnet integration for token bonding curves and liquidity
- **Full feature set** build, not phased MVP

---

## Phase 1: Foundation — Theme, Brand System & Landing Page

**Design system overhaul** in `styles.css`:
- Neon color palette: Volt Green (#00FF85), Signal Red (#FF2E2E), Hyper Purple (#8B5CFF), Ice Cyan (#00D9FF), Alert Yellow (#FFD400)
- Deep animated gradient backgrounds with noise texture
- Custom CSS keyframes: price-snap, jitter, shockwave-pulse, collapse-ripple, gradient-drift
- Inter font loaded via Google Fonts

**Landing page** (`/`):
- BGRR ticker logo with glitch wordmark animation
- Animated gradient hero: "Attention is the asset. Trade it."
- Simulated live price ticker with fake posts moving
- 3 agent introduction cards (RUSH ⚡, ORACLE 👁, MYTH 🌀) with personality quotes
- CTA: "Enter the Market" → `/feed`

---

## Phase 2: Database Schema & Auth (Lovable Cloud)

**Enable Lovable Cloud** and create tables:
- `profiles` — username, display_name, avatar_url, total_pnl, wallet_address
- `posts` — creator_id, content, current_price, price_change_pct, volume, token_address (Four.meme)
- `trades` — user_id, post_id, action (APE/EXIT), amount, price_at_trade
- `price_history` — post_id, price, recorded_at (for sparklines)
- `rotations` — user_id, from_post_id, to_post_id, amount, price_from, price_to
- `clips` — post_id, clip_type (APE_MOMENT/ORACLE_CALL/MYTH_DROP/VOLATILITY_SPIKE/AGENT_WAR), trigger_event, created_at
- `activity_feed` — actor_type (user/agent/system), actor_name, action, post_id, metadata
- `user_roles` — standard security pattern (admin/user)

**Auth**: Email + password with Bangrr-styled login/signup (neon borders, glitch effects, system voice on errors: "Too slow.", "You missed it.")

---

## Phase 3: Core Trading Feed (`/feed`)

**Post cards** (tradable assets):
- Creator avatar + name, dominant price (48-72px bold), % change (green/red)
- Content (opinion/meme text)
- APE button (green shockwave pulse on click) + EXIT button (red collapse ripple)
- Volume display, sparkline from price_history
- Jitter animation on volatile posts

**Feed behavior**:
- Real-time price updates via Supabase realtime subscriptions
- Dynamic reordering by momentum (price change velocity)
- Smooth layout transitions when posts move

**Trading server functions**:
- APE: increase price, record trade, update volume, trigger green animation
- EXIT: decrease price, record trade, trigger red animation
- Price calculation based on supply/demand from trade history

---

## Phase 4: AI Agents (Server Functions + AI Gateway)

Three agent server functions that run periodically:
- **RUSH ⚡**: Monitors trending posts, auto-APEs into momentum, creates volatility spikes. High frequency.
- **ORACLE 👁**: Analyzes posts for early value signals, takes positions before trends. Low frequency, high conviction.
- **MYTH 🌀**: Generates new provocative posts using AI, injects narratives, seeds new tradable assets.

Agent actions appear in activity_feed with personality-matched messages.
Triggered via scheduled API calls or manual trigger button for demo.

---

## Phase 5: Clip System (Virality Engine)

**Auto-clip detection** (server function):
- Monitors for clip-worthy events: price spikes >20%, rapid APE sequences, agent actions, narrative injections
- Creates clip records with type classification (APE MOMENT, ORACLE CALL, MYTH DROP, VOLATILITY SPIKE, AGENT WAR)

**Clip UI** on post cards:
- Clip badge/indicator when a moment is captured
- Clip feed/gallery showing recent viral moments
- Clip → Attention ↑ → Price ↑ feedback loop (clips boost the post's visibility/price)

---

## Phase 6: Rotation Engine (DEX for Attention)

**Rotation mechanic**:
- Swap attention from Asset A → Asset B without exiting to cash
- UI: select source post, select target post, set amount, execute rotation
- Server function: decrease source price, increase target price, record rotation
- Rotation history on user profile

**Rotation UI**: Swap-style interface (like DEX) with the two assets, amounts, and price impact preview.

---

## Phase 7: BNB Chain + Four.meme Integration (Testnet)

- Connect to BNB testnet via ethers.js/viem (browser-compatible)
- Four.meme testnet integration for token creation with bonding curves
- Each post can have an associated token (token_address in posts table)
- Display on-chain price alongside attention price
- Wallet connect button on profile

---

## Phase 8: Leaderboard & Activity Systems

**Activity ticker** (persistent sidebar/bottom bar):
- Real-time scrolling feed of all market activity
- System messages in Bangrr voice: "MARKET SPIKING", "LIQUIDITY SHIFT", "YOU ARE LATE"
- Agent and user actions with emoji indicators

**Leaderboard** (`/leaderboard`):
- Top gaining posts (biggest price movers)
- Most active agents
- Highest volatility assets
- User PnL rankings

---

## Phase 9: Motion Polish & System Voice

- Animated gradient backgrounds (slow-moving "market atmosphere")
- Price snap animations with overshoot
- APE green shockwave, EXIT red collapse
- Feed reorder smooth transitions
- Volatile post jitter CSS animation
- Toast notifications in Bangrr voice: "It's moving.", "You're late.", "This is printing."
- Loading states that feel alive

---

## Memory Updates (will save after approval)
- Update brand design memory to bright chaotic futurism direction
- Update core features memory with clips, rotation, BNB integration
- Update project index with all feature references

