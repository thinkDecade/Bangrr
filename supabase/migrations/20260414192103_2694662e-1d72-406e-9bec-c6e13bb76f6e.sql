
-- Allow authenticated users to insert price_history (needed by process_trade via user's session)
CREATE POLICY "Authenticated users can insert price history"
ON public.price_history
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow any authenticated user to update post prices (for trade execution)
CREATE POLICY "System can update post prices"
ON public.posts
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create the atomic trade processing function
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
  -- Get the authenticated user
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Validate action
  IF _action NOT IN ('APE', 'EXIT') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid action');
  END IF;

  -- Validate amount
  IF _amount <= 0 OR _amount > 10000 THEN
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

  -- 1. Insert trade record
  INSERT INTO trades (user_id, post_id, action, amount, price_at_trade)
  VALUES (_user_id, _post_id, _action, _amount, _old_price);

  -- 2. Update post price, volume, and change %
  UPDATE posts SET
    current_price = _new_price,
    price_change_pct = _price_change_pct,
    volume = _new_volume
  WHERE id = _post_id;

  -- 3. Record price history for sparkline
  INSERT INTO price_history (post_id, price)
  VALUES (_post_id, _new_price);

  -- 4. Log activity
  INSERT INTO activity_feed (actor_type, actor_name, action, post_id, metadata)
  VALUES (
    'user',
    _user_id::text,
    _action,
    _post_id,
    jsonb_build_object(
      'amount', _amount,
      'old_price', _old_price,
      'new_price', _new_price,
      'price_change_pct', _price_change_pct
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'old_price', _old_price,
    'new_price', _new_price,
    'price_change_pct', _price_change_pct,
    'volume', _new_volume
  );
END;
$$;
