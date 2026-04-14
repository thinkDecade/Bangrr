
-- Create agent_process_trade: a SECURITY DEFINER function that trades on behalf of an agent
-- Uses a fixed system user ID pattern instead of auth.uid()
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
  -- Validate agent name
  IF _agent_name NOT IN ('RUSH', 'ORACLE', 'MYTH') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid agent');
  END IF;

  -- Validate action
  IF _action NOT IN ('APE', 'EXIT') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid action');
  END IF;

  -- Validate amount
  IF _amount <= 0 OR _amount > 100 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid amount');
  END IF;

  -- Lock and fetch the post
  SELECT * INTO _post FROM posts WHERE id = _post_id AND is_active = true FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Post not found or inactive');
  END IF;

  _old_price := COALESCE(_post.current_price, 1.0);
  _direction := CASE WHEN _action = 'APE' THEN 1 ELSE -1 END;

  -- Bonding curve: price = old_price * (1 + direction * 0.05 * sqrt(amount))
  _new_price := _old_price * (1 + _direction * 0.05 * sqrt(_amount));
  _new_price := GREATEST(0.01, _new_price);
  _price_change_pct := ((_new_price - _old_price) / _old_price) * 100;
  _new_volume := COALESCE(_post.volume, 0) + _amount::bigint;

  -- Update post price, volume, and change %
  UPDATE posts SET
    current_price = _new_price,
    price_change_pct = _price_change_pct,
    volume = _new_volume
  WHERE id = _post_id;

  -- Record price history for sparkline
  INSERT INTO price_history (post_id, price)
  VALUES (_post_id, _new_price);

  -- Log activity with agent identity
  INSERT INTO activity_feed (actor_type, actor_name, action, post_id, metadata)
  VALUES (
    'agent',
    _agent_name,
    _action,
    _post_id,
    jsonb_build_object(
      'amount', _amount,
      'old_price', _old_price,
      'new_price', _new_price,
      'price_change_pct', _price_change_pct,
      'agent', _agent_name
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'agent', _agent_name,
    'action', _action,
    'old_price', _old_price,
    'new_price', _new_price,
    'price_change_pct', _price_change_pct,
    'volume', _new_volume
  );
END;
$$;
