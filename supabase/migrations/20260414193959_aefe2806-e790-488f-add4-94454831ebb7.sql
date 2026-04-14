
-- Function to detect and create clips
CREATE OR REPLACE FUNCTION public.check_and_create_clip(
  _post_id uuid,
  _action text,
  _amount numeric,
  _old_price numeric,
  _new_price numeric,
  _price_change_pct numeric,
  _actor_type text,
  _actor_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _abs_change numeric;
  _recent_prices numeric[];
  _price_range numeric;
  _avg_price numeric;
BEGIN
  _abs_change := ABS(_price_change_pct);

  -- APE_MOMENT: large buy impact (≥8% up) or big amount (≥5)
  IF _action = 'APE' AND (_abs_change >= 8 OR _amount >= 5) THEN
    INSERT INTO clips (post_id, clip_type, trigger_event)
    VALUES (_post_id, 'APE_MOMENT', jsonb_build_object(
      'actor_type', _actor_type,
      'actor_name', _actor_name,
      'amount', _amount,
      'old_price', _old_price,
      'new_price', _new_price,
      'price_change_pct', _price_change_pct
    ));
  END IF;

  -- ORACLE_CALL: ORACLE agent trade with significant impact (≥6%)
  IF _actor_type = 'agent' AND _actor_name = 'ORACLE' AND _abs_change >= 6 THEN
    INSERT INTO clips (post_id, clip_type, trigger_event)
    VALUES (_post_id, 'ORACLE_CALL', jsonb_build_object(
      'action', _action,
      'amount', _amount,
      'old_price', _old_price,
      'new_price', _new_price,
      'price_change_pct', _price_change_pct
    ));
  END IF;

  -- VOLATILITY_SPIKE: check recent price range vs average
  SELECT ARRAY_AGG(price ORDER BY recorded_at DESC)
  INTO _recent_prices
  FROM (
    SELECT price, recorded_at FROM price_history
    WHERE post_id = _post_id
    ORDER BY recorded_at DESC
    LIMIT 5
  ) sub;

  IF _recent_prices IS NOT NULL AND array_length(_recent_prices, 1) >= 3 THEN
    _price_range := (SELECT MAX(v) - MIN(v) FROM unnest(_recent_prices) AS v);
    _avg_price := (SELECT AVG(v) FROM unnest(_recent_prices) AS v);

    IF _avg_price > 0 AND (_price_range / _avg_price) * 100 >= 15 THEN
      -- Only create if no VOLATILITY_SPIKE for this post in last 2 minutes
      IF NOT EXISTS (
        SELECT 1 FROM clips
        WHERE post_id = _post_id
          AND clip_type = 'VOLATILITY_SPIKE'
          AND created_at > now() - interval '2 minutes'
      ) THEN
        INSERT INTO clips (post_id, clip_type, trigger_event)
        VALUES (_post_id, 'VOLATILITY_SPIKE', jsonb_build_object(
          'recent_prices', to_jsonb(_recent_prices),
          'price_range', _price_range,
          'avg_price', _avg_price,
          'volatility_pct', (_price_range / _avg_price) * 100
        ));
      END IF;
    END IF;
  END IF;
END;
$$;

-- Update process_trade to call clip detection
CREATE OR REPLACE FUNCTION public.process_trade(
  _post_id uuid,
  _action text,
  _amount numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _post record;
  _old_price numeric;
  _new_price numeric;
  _price_change_pct numeric;
  _new_volume bigint;
  _direction numeric;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF _action NOT IN ('APE', 'EXIT') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid action');
  END IF;

  IF _amount <= 0 OR _amount > 10000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid amount');
  END IF;

  SELECT * INTO _post FROM posts WHERE id = _post_id AND is_active = true FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Post not found or inactive');
  END IF;

  _old_price := COALESCE(_post.current_price, 1.0);
  _direction := CASE WHEN _action = 'APE' THEN 1 ELSE -1 END;
  _new_price := _old_price * (1 + _direction * 0.05 * sqrt(_amount));
  _new_price := GREATEST(0.01, _new_price);
  _price_change_pct := ((_new_price - _old_price) / _old_price) * 100;
  _new_volume := COALESCE(_post.volume, 0) + _amount::bigint;

  INSERT INTO trades (user_id, post_id, action, amount, price_at_trade)
  VALUES (_user_id, _post_id, _action, _amount, _old_price);

  UPDATE posts SET
    current_price = _new_price,
    price_change_pct = _price_change_pct,
    volume = _new_volume
  WHERE id = _post_id;

  INSERT INTO price_history (post_id, price)
  VALUES (_post_id, _new_price);

  INSERT INTO activity_feed (actor_type, actor_name, action, post_id, metadata)
  VALUES (
    'user', _user_id::text, _action, _post_id,
    jsonb_build_object(
      'amount', _amount, 'old_price', _old_price,
      'new_price', _new_price, 'price_change_pct', _price_change_pct
    )
  );

  -- Check for clip-worthy moments
  PERFORM check_and_create_clip(
    _post_id, _action, _amount, _old_price, _new_price, _price_change_pct,
    'user', _user_id::text
  );

  RETURN jsonb_build_object(
    'success', true, 'old_price', _old_price,
    'new_price', _new_price, 'price_change_pct', _price_change_pct,
    'volume', _new_volume
  );
END;
$$;

-- Update agent_process_trade to call clip detection
CREATE OR REPLACE FUNCTION public.agent_process_trade(
  _agent_name text,
  _post_id uuid,
  _action text,
  _amount numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _post record;
  _old_price numeric;
  _new_price numeric;
  _price_change_pct numeric;
  _new_volume bigint;
  _direction numeric;
BEGIN
  IF _agent_name NOT IN ('RUSH', 'ORACLE', 'MYTH') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid agent');
  END IF;

  IF _action NOT IN ('APE', 'EXIT') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid action');
  END IF;

  IF _amount <= 0 OR _amount > 100 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid amount');
  END IF;

  SELECT * INTO _post FROM posts WHERE id = _post_id AND is_active = true FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Post not found or inactive');
  END IF;

  _old_price := COALESCE(_post.current_price, 1.0);
  _direction := CASE WHEN _action = 'APE' THEN 1 ELSE -1 END;
  _new_price := _old_price * (1 + _direction * 0.05 * sqrt(_amount));
  _new_price := GREATEST(0.01, _new_price);
  _price_change_pct := ((_new_price - _old_price) / _old_price) * 100;
  _new_volume := COALESCE(_post.volume, 0) + _amount::bigint;

  UPDATE posts SET
    current_price = _new_price,
    price_change_pct = _price_change_pct,
    volume = _new_volume
  WHERE id = _post_id;

  INSERT INTO price_history (post_id, price)
  VALUES (_post_id, _new_price);

  INSERT INTO activity_feed (actor_type, actor_name, action, post_id, metadata)
  VALUES (
    'agent', _agent_name, _action, _post_id,
    jsonb_build_object(
      'amount', _amount, 'old_price', _old_price,
      'new_price', _new_price, 'price_change_pct', _price_change_pct,
      'agent', _agent_name
    )
  );

  -- Check for clip-worthy moments
  PERFORM check_and_create_clip(
    _post_id, _action, _amount, _old_price, _new_price, _price_change_pct,
    'agent', _agent_name
  );

  RETURN jsonb_build_object(
    'success', true, 'agent', _agent_name, 'action', _action,
    'old_price', _old_price, 'new_price', _new_price,
    'price_change_pct', _price_change_pct, 'volume', _new_volume
  );
END;
$$;

-- Enable realtime for clips
ALTER PUBLICATION supabase_realtime ADD TABLE public.clips;
