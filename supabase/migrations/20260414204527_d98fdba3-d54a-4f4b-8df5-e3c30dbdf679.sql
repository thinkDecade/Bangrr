-- Early Ape NFT tracking table
CREATE TABLE public.early_ape_nfts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id),
  user_id uuid NOT NULL,
  entry_price numeric NOT NULL,
  qualifying_price numeric NOT NULL,
  token_id integer,
  minted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id)
);

ALTER TABLE public.early_ape_nfts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view early ape nfts" ON public.early_ape_nfts
  FOR SELECT TO public USING (true);

-- Function to check and award Early Ape NFT after a trade
CREATE OR REPLACE FUNCTION public.check_early_ape_nft(_post_id uuid, _new_price numeric)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _initial_price numeric;
  _first_aper uuid;
  _first_ape_price numeric;
  _nft_exists boolean;
  _next_token_id integer;
BEGIN
  -- Check if NFT already awarded for this post
  SELECT EXISTS(SELECT 1 FROM early_ape_nfts WHERE post_id = _post_id) INTO _nft_exists;
  IF _nft_exists THEN RETURN; END IF;

  -- Get the initial price (first price_history entry)
  SELECT price INTO _initial_price
  FROM price_history WHERE post_id = _post_id
  ORDER BY recorded_at ASC LIMIT 1;

  IF _initial_price IS NULL OR _initial_price <= 0 THEN RETURN; END IF;

  -- Check if price has reached 5× initial
  IF _new_price < _initial_price * 5 THEN RETURN; END IF;

  -- Find the first APE trader on this post
  SELECT user_id, price_at_trade INTO _first_aper, _first_ape_price
  FROM trades
  WHERE post_id = _post_id AND action = 'APE'
  ORDER BY created_at ASC
  LIMIT 1;

  IF _first_aper IS NULL THEN RETURN; END IF;

  -- Generate next token ID
  SELECT COALESCE(MAX(token_id), 0) + 1 INTO _next_token_id FROM early_ape_nfts;

  -- Mint the NFT record
  INSERT INTO early_ape_nfts (post_id, user_id, entry_price, qualifying_price, token_id)
  VALUES (_post_id, _first_aper, _first_ape_price, _new_price, _next_token_id);

  -- Log activity
  INSERT INTO activity_feed (actor_type, actor_name, action, post_id, metadata)
  VALUES ('system', 'EARLY_APE', 'NFT_MINTED', _post_id,
    jsonb_build_object(
      'user_id', _first_aper,
      'token_id', _next_token_id,
      'entry_price', _first_ape_price,
      'qualifying_price', _new_price,
      'multiplier', ROUND(_new_price / _initial_price, 1)
    ));

  -- Create a clip for the NFT mint
  INSERT INTO clips (post_id, clip_type, trigger_event)
  VALUES (_post_id, 'APE_MOMENT', jsonb_build_object(
    'actor_type', 'system',
    'actor_name', 'EARLY_APE_NFT',
    'amount', 0,
    'old_price', _initial_price,
    'new_price', _new_price,
    'price_change_pct', ROUND(((_new_price - _initial_price) / _initial_price) * 100, 1)
  ));
END;
$$;

-- Wire check_early_ape_nft into process_trade
CREATE OR REPLACE FUNCTION public.process_trade(_post_id uuid, _action text, _amount numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  PERFORM check_and_create_clip(
    _post_id, _action, _amount, _old_price, _new_price, _price_change_pct,
    'user', _user_id::text
  );

  -- Check for Early Ape NFT
  PERFORM check_early_ape_nft(_post_id, _new_price);

  RETURN jsonb_build_object(
    'success', true, 'old_price', _old_price,
    'new_price', _new_price, 'price_change_pct', _price_change_pct,
    'volume', _new_volume
  );
END;
$function$;