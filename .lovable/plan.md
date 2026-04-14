

# Phase 2: Database Schema & Auth

## Overview
Enable Lovable Cloud and set up the full database schema plus Bangrrr-styled authentication. No Supabase integration exists yet — this is greenfield.

## Step 1: Enable Lovable Cloud
- Enable Cloud to get Supabase integration files (`src/integrations/supabase/`)
- This provides `client.ts`, `client.server.ts`, `auth-middleware.ts`

## Step 2: Database Migrations

Create tables via migrations:

**`profiles`** — extends auth.users
- `id` (uuid, FK → auth.users, PK), `username` (text, unique), `display_name` (text), `avatar_url` (text), `total_pnl` (numeric, default 0), `wallet_address` (text), `created_at`
- Trigger: auto-create profile on signup
- RLS: users read all, update own

**`posts`** — tradable attention assets
- `id` (uuid), `creator_id` (FK → profiles), `content` (text), `current_price` (numeric, default 1.0), `price_change_pct` (numeric, default 0), `volume` (bigint, default 0), `token_address` (text, nullable), `is_active` (boolean, default true), `created_at`
- RLS: anyone reads, authenticated users insert own

**`trades`** — APE/EXIT records
- `id` (uuid), `user_id` (FK → profiles), `post_id` (FK → posts), `action` (text, check APE/EXIT), `amount` (numeric), `price_at_trade` (numeric), `created_at`
- RLS: users read own, insert own

**`price_history`** — sparkline data
- `id` (uuid), `post_id` (FK → posts), `price` (numeric), `recorded_at` (timestamptz, default now())
- RLS: anyone reads

**`rotations`** — DEX swaps
- `id` (uuid), `user_id` (FK → profiles), `from_post_id` (FK → posts), `to_post_id` (FK → posts), `amount` (numeric), `price_from` (numeric), `price_to` (numeric), `created_at`
- RLS: users read own, insert own

**`clips`** — viral moment captures
- `id` (uuid), `post_id` (FK → posts), `clip_type` (text, check: APE_MOMENT/ORACLE_CALL/MYTH_DROP/VOLATILITY_SPIKE/AGENT_WAR), `trigger_event` (jsonb), `created_at`
- RLS: anyone reads

**`activity_feed`** — live market activity
- `id` (uuid), `actor_type` (text, check: user/agent/system), `actor_name` (text), `action` (text), `post_id` (FK → posts, nullable), `metadata` (jsonb), `created_at`
- RLS: anyone reads, server inserts

**`user_roles`** — security pattern
- `id` (uuid), `user_id` (FK → auth.users, cascade), `role` (app_role enum: admin/moderator/user), unique(user_id, role)
- `has_role()` security definer function
- RLS: users read own

## Step 3: Auth Pages

**`/login`** route — Bangrrr-styled:
- Email + password form with neon borders, glitch effects
- System voice error messages ("Too slow.", "Wrong keys.", "You missed it.")
- Link to signup, forgot password
- Redirect back to intended page after login

**`/signup`** route:
- Username + email + password
- Auto-create profile via trigger
- System voice: "welcome to the chaos."

**`/reset-password`** route:
- Password reset flow per Supabase pattern

## Step 4: Auth Guard

**`/_authenticated.tsx`** layout route:
- `beforeLoad` checks auth via router context
- Redirects to `/login` with redirect-back
- All protected routes (feed, profile) nest under this

## Step 5: Router Context Update

- Update `__root.tsx` to `createRootRouteWithContext` with auth state
- Set up `QueryClientProvider` for TanStack Query
- Update `router.tsx` to pass auth context

## Files Created/Modified
- 8 migration files (one per table + enum + trigger + has_role function)
- `src/routes/login.tsx` — styled login page
- `src/routes/signup.tsx` — styled signup page  
- `src/routes/reset-password.tsx` — password reset
- `src/routes/_authenticated.tsx` — auth guard layout
- `src/routes/__root.tsx` — add auth context + QueryClientProvider
- `src/router.tsx` — auth context setup
- `src/hooks/use-auth.tsx` — auth state hook

## Technical Notes
- Branding stays "BANGRR" throughout auth pages
- System voice personality on all auth error/success states
- Neon border/glow effects on form inputs matching the brand
- No new heavy dependencies — uses existing Framer Motion + Tailwind
- Need to fix "BANGRRR" → "BANGRR" in `__root.tsx` meta tags (spotted during review)

