
ALTER TABLE public.early_ape_nfts
  ADD COLUMN IF NOT EXISTS tx_hash text,
  ADD COLUMN IF NOT EXISTS mint_status text NOT NULL DEFAULT 'pending';

CREATE OR REPLACE FUNCTION public.confirm_early_ape_mint(
  _nft_id uuid,
  _tx_hash text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _nft record;
  _caller uuid;
BEGIN
  _caller := auth.uid();
  IF _caller IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO _nft FROM early_ape_nfts WHERE id = _nft_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NFT not found');
  END IF;

  IF _nft.user_id <> _caller THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not the owner');
  END IF;

  IF _nft.mint_status = 'minted' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already minted');
  END IF;

  UPDATE early_ape_nfts
  SET mint_status = 'minted', tx_hash = _tx_hash
  WHERE id = _nft_id;

  INSERT INTO activity_feed (actor_type, actor_name, action, post_id, metadata)
  VALUES ('user', _caller::text, 'NFT_CLAIMED', _nft.post_id,
    jsonb_build_object(
      'nft_id', _nft_id,
      'token_id', _nft.token_id,
      'tx_hash', _tx_hash
    ));

  RETURN jsonb_build_object('success', true, 'tx_hash', _tx_hash, 'token_id', _nft.token_id);
END;
$$;
