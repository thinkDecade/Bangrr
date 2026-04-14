-- Leveraged positions table for MYX Finance integration
CREATE TABLE public.leveraged_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  post_id uuid NOT NULL REFERENCES posts(id),
  action text NOT NULL CHECK (action IN ('APE', 'EXIT')),
  amount numeric NOT NULL,
  leverage integer NOT NULL CHECK (leverage IN (2, 5, 10)),
  entry_price numeric NOT NULL,
  liquidation_price numeric NOT NULL,
  is_open boolean NOT NULL DEFAULT true,
  pnl numeric DEFAULT 0,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leveraged_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own positions" ON public.leveraged_positions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own positions" ON public.leveraged_positions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own positions" ON public.leveraged_positions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Function to open a leveraged position
CREATE OR REPLACE FUNCTION public.open_leveraged_position(
  _post_id uuid, _action text, _amount numeric, _leverage integer
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _user_id uuid;
  _post record;
  _entry_price numeric;
  _liq_price numeric;
  _direction numeric;
  _pos_id uuid;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF _action NOT IN ('APE', 'EXIT') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid action');
  END IF;

  IF _leverage NOT IN (2, 5, 10) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid leverage');
  END IF;

  IF _amount <= 0 OR _amount > 10000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid amount');
  END IF;

  SELECT * INTO _post FROM posts WHERE id = _post_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Post not found');
  END IF;

  _entry_price := COALESCE(_post.current_price, 1.0);
  _direction := CASE WHEN _action = 'APE' THEN 1 ELSE -1 END;

  _liq_price := _entry_price * (1 - _direction * (1.0 / _leverage));
  _liq_price := GREATEST(0.01, _liq_price);

  INSERT INTO leveraged_positions (user_id, post_id, action, amount, leverage, entry_price, liquidation_price)
  VALUES (_user_id, _post_id, _action, _amount, _leverage, _entry_price, _liq_price)
  RETURNING id INTO _pos_id;

  PERFORM process_trade(_post_id, _action, _amount * _leverage * 0.3);

  INSERT INTO activity_feed (actor_type, actor_name, action, post_id, metadata)
  VALUES ('user', _user_id::text, 'LEVERAGE_' || _action, _post_id,
    jsonb_build_object('amount', _amount, 'leverage', _leverage, 'entry_price', _entry_price, 'liquidation_price', _liq_price));

  RETURN jsonb_build_object(
    'success', true, 'position_id', _pos_id,
    'entry_price', _entry_price, 'liquidation_price', _liq_price,
    'leverage', _leverage
  );
END;
$$;

-- Function to check and liquidate positions
CREATE OR REPLACE FUNCTION public.check_liquidations(_post_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _post record;
  _current_price numeric;
  _liquidated integer := 0;
  _pos record;
BEGIN
  SELECT * INTO _post FROM posts WHERE id = _post_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('liquidated', 0);
  END IF;

  _current_price := COALESCE(_post.current_price, 1.0);

  FOR _pos IN
    SELECT * FROM leveraged_positions
    WHERE post_id = _post_id AND is_open = true
  LOOP
    IF (_pos.action = 'APE' AND _current_price <= _pos.liquidation_price)
       OR (_pos.action = 'EXIT' AND _current_price >= _pos.liquidation_price)
    THEN
      UPDATE leveraged_positions SET
        is_open = false,
        pnl = -_pos.amount,
        closed_at = now()
      WHERE id = _pos.id;

      INSERT INTO activity_feed (actor_type, actor_name, action, post_id, metadata)
      VALUES ('system', 'MYX', 'LIQUIDATED', _post_id,
        jsonb_build_object('position_id', _pos.id, 'user_id', _pos.user_id,
          'leverage', _pos.leverage, 'entry_price', _pos.entry_price,
          'liquidation_price', _pos.liquidation_price, 'current_price', _current_price));

      _liquidated := _liquidated + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('liquidated', _liquidated, 'current_price', _current_price);
END;
$$;