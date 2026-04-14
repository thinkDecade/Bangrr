
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  total_pnl NUMERIC DEFAULT 0,
  wallet_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- POSTS
-- ============================================
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  current_price NUMERIC DEFAULT 1.0,
  price_change_pct NUMERIC DEFAULT 0,
  volume BIGINT DEFAULT 0,
  token_address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view posts"
  ON public.posts FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create own posts"
  ON public.posts FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- ============================================
-- TRADES
-- ============================================
CREATE TABLE public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('APE', 'EXIT')),
  amount NUMERIC NOT NULL,
  price_at_trade NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trades"
  ON public.trades FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades"
  ON public.trades FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- PRICE HISTORY
-- ============================================
CREATE TABLE public.price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view price history"
  ON public.price_history FOR SELECT USING (true);

-- ============================================
-- ROTATIONS
-- ============================================
CREATE TABLE public.rotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  from_post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  to_post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  price_from NUMERIC NOT NULL,
  price_to NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rotations"
  ON public.rotations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rotations"
  ON public.rotations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- CLIPS
-- ============================================
CREATE TABLE public.clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  clip_type TEXT NOT NULL CHECK (clip_type IN ('APE_MOMENT', 'ORACLE_CALL', 'MYTH_DROP', 'VOLATILITY_SPIKE', 'AGENT_WAR')),
  trigger_event JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view clips"
  ON public.clips FOR SELECT USING (true);

-- ============================================
-- ACTIVITY FEED
-- ============================================
CREATE TABLE public.activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'agent', 'system')),
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view activity feed"
  ON public.activity_feed FOR SELECT USING (true);

-- ============================================
-- USER ROLES
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_posts_creator ON public.posts(creator_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_trades_user ON public.trades(user_id);
CREATE INDEX idx_trades_post ON public.trades(post_id);
CREATE INDEX idx_price_history_post ON public.price_history(post_id);
CREATE INDEX idx_price_history_recorded ON public.price_history(recorded_at DESC);
CREATE INDEX idx_rotations_user ON public.rotations(user_id);
CREATE INDEX idx_clips_post ON public.clips(post_id);
CREATE INDEX idx_activity_feed_created ON public.activity_feed(created_at DESC);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
