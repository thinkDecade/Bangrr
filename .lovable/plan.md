

# Homepage Upgrade — PRD v2 Alignment

## What's Changing

### Branding consistency
- All references to "BANGRRR" → **"BANGRR"** (two R's, not three) across every component
- GlitchLogo text updated to "BANGRR"

### New integrations to showcase (from PRD v2)
- **Unibase** — Agent Memory layer (on-chain reputation for agents)
- **Pieverse** — Gasless trades via x402 protocol
- **MYX Finance** — Leveraged attention positions (bonus feature)
- **Four.meme** — MYTH auto-deploys tokens from narratives
- **Early Ape NFT** — First APE into a post that later 5x+ = auto-minted NFT

### Voice & messaging fixes
- Remove "front-running you" / "they're your competition" language from agent section
- Reframe agents as **market participants that create action** — they make the market alive, not adversarial
- Add new concept: **"Appease the Viral Agents"** — users can appeal to agents to amplify their posts (teased as coming soon)

### New feature: Agent War mechanic
- RUSH vs ORACLE take opposing positions — community picks sides
- Losing agent gets liquidated visibly — spectator sport

---

## Files Modified

### 1. `src/components/landing/GlitchLogo.tsx`
- Change "BANGRRR" → "BANGRR" in all text layers

### 2. `src/components/landing/HeroSection.tsx`
- Update tagline copy — keep degen voice, remove adversarial agent framing
- Add tech stack badges: BNB Chain, Four.meme, Unibase, Pieverse
- Fix branding to "BANGRR"

### 3. `src/components/landing/ConceptSlider.tsx`
- Update agent slide: remove "front-runs" language, reframe as "3 AI agents creating chaos in the market — they APE, EXIT, create content, and make things move"
- Add new slide: **"what are Agent Wars?"** — RUSH vs ORACLE opposing positions, community picks sides
- Add new slide: **"what's an Early Ape NFT?"** — first APE into a post that 5x+ = on-chain proof
- Add new slide: **"gasless trading?"** — Pieverse x402 protocol, no gas friction
- Fix branding references

### 4. `src/components/landing/AgentCards.tsx`
- Remove "your competition" framing from parent section
- Add personality detail: agents have on-chain memory (Unibase), reputation that builds over time
- Add "Agent War" teaser — when RUSH and ORACLE disagree, chaos ensues
- New card detail: each agent shows their archetype (Trickster, Analyst, Instigator per PRD)
- Tease "Appease the Agents" feature — a subtle badge/tag: "🔮 coming soon: summon agents to boost your post"

### 5. `src/components/landing/FeatureShowcase.tsx`
- Add new features:
  - **Gasless Trading (Pieverse)** — agents and users trade without gas via x402
  - **Agent Wars** — RUSH vs ORACLE opposing positions, community picks sides, liquidation events
  - **Early Ape NFT** — BEP-721 auto-minted when you're first to APE a post that 5x+
  - **Agent Memory (Unibase)** — agents have persistent on-chain reputation
- Update existing feature descriptions to match PRD v2 language
- Update BNB Chain card to mention Four.meme MYTH auto-deploying tokens

### 6. `src/components/landing/SystemVoiceCTA.tsx`
- Fix branding
- Keep APE/EXIT/ROTATE/CLIP vocabulary badges

### 7. `src/routes/index.tsx`
- Update meta tags to "BANGRR" (not BANGRRR)
- Update agents section heading: remove "they're your competition" — replace with "they're already in the market"
- Add new section between agents and features: **"Appease the Gods"** teaser — "coming soon: summon agents to amplify your post. sacrifice attention. gain virality." with a "notify me" style CTA

### 8. `src/components/landing/MockTicker.tsx`
- Fix any "BANGRRR" references to "BANGRR"

### 9. `src/styles.css`
- No structural changes needed — existing theme supports all updates

### 10. Memory updates
- Update `mem://features/bangrr-core` with Unibase, Pieverse, MYX, Agent Wars, Early Ape NFT
- Update `mem://index.md` to reflect new feature set

---

## Technical Notes
- No new packages needed — existing Swiper, Framer Motion, and Tailwind handle everything
- All changes are component-level content and copy updates
- New "Appease the Gods" section uses existing motion patterns (framer-motion fade-in)

