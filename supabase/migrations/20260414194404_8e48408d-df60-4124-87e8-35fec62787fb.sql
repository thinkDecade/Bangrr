
CREATE OR REPLACE FUNCTION public.process_rotation(
  _from_post_id uuid,
  _to_post_id uuid,
  _amount numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _from_post record;
  _to_post record;
  _from_old_price numeric;
  _from_new_price numeric;
  _from_change_pct numeric;
  _to_old_price numeric;
  _to_new_price numeric;
  _to_change_pct numeric;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF _from_post_id = _to_post_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot rotate to the same post');
  END IF;

  IF _amount <= 0 OR _amount > 10000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid amount');
  END IF;

  -- Lock both posts (ordered by id to prevent deadlocks)
  IF _from_post_id < _to_post_id THEN
    SELECT * INTO _from_post FROM posts WHERE id = _from_post_id AND is_active = true FOR UPDATE;
    SELECT * INTO _to_post FROM posts WHERE id = _to_post_id AND is_active = true FOR UPDATE;
  ELSE
    SELECT * INTO _to_post FROM posts WHERE id = _to_post_id AND is_active = true FOR UPDATE;
    SELECT * INTO _from_post FROM posts WHERE id = _from_post_id AND is_active = true FOR UPDATE;
  END IF;

  IF _from_post IS NULL OR _to_post IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'One or both posts not found');
  END IF;

  -- EXIT from_post (price goes down)
  _from_old_price := COALESCE(_from_post.current_price, 1.0);
  _from_new_price := _from_old_price * (1 - 0.05 * sqrt(_amount));
  _from_new_price := GREATEST(0.01, _from_new_price);
  _from_change_pct := ((_from_new_price - _from_old_price) / _from_old_price) * 100;

  -- APE to_post (price goes up)
  _to_old_price := COALESCE(_to_post.current_price, 1.0);
  _to_new_price := _to_old_price * (1 + 0.05 * sqrt(_amount));
  _to_change_pct := ((_to_new_price - _to_old_price) / _to_old_price) * 100;

  -- Update from_post
  UPDATE posts SET
    current_price = _from_new_price,
    price_change_pct = _from_change_pct,
    volume = COALESCE(volume, 0) + _amount::bigint
  WHERE id = _from_post_id;

  -- Update to_post
  UPDATE posts SET
    current_price = _to_new_price,
    price_change_pct = _to_change_pct,
    volume = COALESCE(volume, 0) + _amount::bigint
  WHERE id = _to_post_id;

  -- Record price history for both
  INSERT INTO price_history (post_id, price) VALUES (_from_post_id, _from_new_price);
  INSERT INTO price_history (post_id, price) VALUES (_to_post_id, _to_new_price);

  -- Record trades for both legs
  INSERT INTO trades (user_id, post_id, action, amount, price_at_trade)
  VALUES (_user_id, _from_post_id, 'EXIT', _amount, _from_old_price);

  INSERT INTO trades (user_id, post_id, action, amount, price_at_trade)
  VALUES (_user_id, _to_post_id, 'APE', _amount, _to_old_price);

  -- Record the rotation
  INSERT INTO rotations (user_id, from_post_id, to_post_id, amount, price_from, price_to)
  VALUES (_user_id, _from_post_id, _to_post_id, _amount, _from_old_price, _to_old_price);

  -- Log activity
  INSERT INTO activity_feed (actor_type, actor_name, action, post_id, metadata)
  VALUES (
    'user', _user_id::text, 'ROTATE', _to_post_id,
    jsonb_build_object(
      'amount', _amount,
      'from_post_id', _from_post_id,
      'from_old_price', _from_old_price,
      'from_new_price', _from_new_price,
      'to_old_price', _to_old_price,
      'to_new_price', _to_new_price
    )
  );

  -- Check clips on both posts
  PERFORM check_and_create_clip(
    _from_post_id, 'EXIT', _amount, _from_old_price, _from_new_price, _from_change_pct,
    'user', _user_id::text
  );
  PERFORM check_and_create_clip(
    _to_post_id, 'APE', _amount, _to_old_price, _to_new_price, _to_change_pct,
    'user', _user_id::text
  );

  RETURN jsonb_build_object(
    'success', true,
    'from_old_price', _from_old_price,
    'from_new_price', _from_new_price,
    'to_old_price', _to_old_price,
    'to_new_price', _to_new_price,
    'amount', _amount
  );
END;
$$;
