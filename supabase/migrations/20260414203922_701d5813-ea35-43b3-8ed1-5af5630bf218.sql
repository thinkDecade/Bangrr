-- Agent Wars: opposing positions between RUSH and ORACLE
CREATE TABLE public.agent_wars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id),
  challenger text NOT NULL CHECK (challenger IN ('RUSH', 'ORACLE', 'MYTH')),
  defender text NOT NULL CHECK (defender IN ('RUSH', 'ORACLE', 'MYTH')),
  challenger_action text NOT NULL CHECK (challenger_action IN ('APE', 'EXIT')),
  defender_action text NOT NULL CHECK (defender_action IN ('APE', 'EXIT')),
  challenger_amount numeric NOT NULL,
  defender_amount numeric NOT NULL,
  entry_price numeric NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  winner text,
  resolved_price numeric,
  community_rush_votes integer NOT NULL DEFAULT 0,
  community_oracle_votes integer NOT NULL DEFAULT 0,
  community_myth_votes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CHECK (challenger <> defender)
);

ALTER TABLE public.agent_wars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view agent wars" ON public.agent_wars
  FOR SELECT TO public USING (true);

-- Community votes for agent wars
CREATE TABLE public.agent_war_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  war_id uuid NOT NULL REFERENCES agent_wars(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  side text NOT NULL CHECK (side IN ('RUSH', 'ORACLE', 'MYTH')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (war_id, user_id)
);

ALTER TABLE public.agent_war_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own votes" ON public.agent_war_votes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own votes" ON public.agent_war_votes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Appease the agents: summon requests
CREATE TABLE public.agent_summons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  post_id uuid NOT NULL REFERENCES posts(id),
  agent_name text NOT NULL CHECK (agent_name IN ('RUSH', 'ORACLE', 'MYTH')),
  ritual_type text NOT NULL DEFAULT 'amplify' CHECK (ritual_type IN ('amplify', 'protect', 'destroy')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.agent_summons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view summons" ON public.agent_summons
  FOR SELECT TO public USING (true);

CREATE POLICY "Users can insert own summons" ON public.agent_summons
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own summons" ON public.agent_summons
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Update check_and_create_clip to handle MYTH_DROP and AGENT_WAR
CREATE OR REPLACE FUNCTION public.check_and_create_clip(_post_id uuid, _action text, _amount numeric, _old_price numeric, _new_price numeric, _price_change_pct numeric, _actor_type text, _actor_name text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _abs_change numeric;
  _recent_prices numeric[];
  _price_range numeric;
  _avg_price numeric;
BEGIN
  _abs_change := ABS(_price_change_pct);

  -- APE_MOMENT: large buy impact (>=8% up) or big amount (>=5)
  IF _action = 'APE' AND (_abs_change >= 8 OR _amount >= 5) THEN
    INSERT INTO clips (post_id, clip_type, trigger_event)
    VALUES (_post_id, 'APE_MOMENT', jsonb_build_object(
      'actor_type', _actor_type, 'actor_name', _actor_name,
      'amount', _amount, 'old_price', _old_price, 'new_price', _new_price,
      'price_change_pct', _price_change_pct
    ));
  END IF;

  -- ORACLE_CALL: ORACLE agent trade with significant impact (>=6%)
  IF _actor_type = 'agent' AND _actor_name = 'ORACLE' AND _abs_change >= 6 THEN
    INSERT INTO clips (post_id, clip_type, trigger_event)
    VALUES (_post_id, 'ORACLE_CALL', jsonb_build_object(
      'action', _action, 'amount', _amount, 'old_price', _old_price,
      'new_price', _new_price, 'price_change_pct', _price_change_pct
    ));
  END IF;

  -- MYTH_DROP: MYTH agent trade with big move (>=7%) or large amount (>=8)
  IF _actor_type = 'agent' AND _actor_name = 'MYTH' AND (_abs_change >= 7 OR _amount >= 8) THEN
    INSERT INTO clips (post_id, clip_type, trigger_event)
    VALUES (_post_id, 'MYTH_DROP', jsonb_build_object(
      'action', _action, 'amount', _amount, 'old_price', _old_price,
      'new_price', _new_price, 'price_change_pct', _price_change_pct
    ));
  END IF;

  -- AGENT_WAR: two different agents traded on same post within last 60 seconds in opposite directions
  IF _actor_type = 'agent' THEN
    IF EXISTS (
      SELECT 1 FROM activity_feed
      WHERE post_id = _post_id
        AND actor_type = 'agent'
        AND actor_name <> _actor_name
        AND action <> _action
        AND created_at > now() - interval '60 seconds'
      LIMIT 1
    ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM clips
        WHERE post_id = _post_id AND clip_type = 'AGENT_WAR'
          AND created_at > now() - interval '2 minutes'
      ) THEN
        INSERT INTO clips (post_id, clip_type, trigger_event)
        VALUES (_post_id, 'AGENT_WAR', jsonb_build_object(
          'trigger_agent', _actor_name, 'trigger_action', _action,
          'amount', _amount, 'old_price', _old_price, 'new_price', _new_price,
          'price_change_pct', _price_change_pct
        ));
      END IF;
    END IF;
  END IF;

  -- VOLATILITY_SPIKE: check recent price range vs average
  SELECT ARRAY_AGG(price ORDER BY recorded_at DESC)
  INTO _recent_prices
  FROM (
    SELECT price, recorded_at FROM price_history
    WHERE post_id = _post_id ORDER BY recorded_at DESC LIMIT 5
  ) sub;

  IF _recent_prices IS NOT NULL AND array_length(_recent_prices, 1) >= 3 THEN
    _price_range := (SELECT MAX(v) - MIN(v) FROM unnest(_recent_prices) AS v);
    _avg_price := (SELECT AVG(v) FROM unnest(_recent_prices) AS v);

    IF _avg_price > 0 AND (_price_range / _avg_price) * 100 >= 15 THEN
      IF NOT EXISTS (
        SELECT 1 FROM clips WHERE post_id = _post_id AND clip_type = 'VOLATILITY_SPIKE'
          AND created_at > now() - interval '2 minutes'
      ) THEN
        INSERT INTO clips (post_id, clip_type, trigger_event)
        VALUES (_post_id, 'VOLATILITY_SPIKE', jsonb_build_object(
          'recent_prices', to_jsonb(_recent_prices), 'price_range', _price_range,
          'avg_price', _avg_price, 'volatility_pct', (_price_range / _avg_price) * 100
        ));
      END IF;
    END IF;
  END IF;
END;
$function$;