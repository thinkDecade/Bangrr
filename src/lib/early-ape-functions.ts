import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getEarlyApeNfts = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    postIds: z.array(z.string().uuid()).min(1).max(50).optional(),
    userId: z.string().uuid().optional(),
  }))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return { nfts: [], error: "Missing env vars" };
    const supabase = createClient(url, key);

    let query = (supabase.from as any)("early_ape_nfts")
      .select("*")
      .order("minted_at", { ascending: false })
      .limit(50);

    if (data.postIds) query = query.in("post_id", data.postIds);
    if (data.userId) query = query.eq("user_id", data.userId);

    const { data: nfts, error } = await query;
    if (error) return { nfts: [], error: error.message };
    return { nfts: nfts ?? [], error: null };
  });

/**
 * List the authenticated user's Early Ape NFTs (with claim status).
 * Powers the profile "Claim on-chain" UI.
 */
export const getMyEarlyApeNfts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as {
      supabase: import("@supabase/supabase-js").SupabaseClient;
      userId: string;
    };

    const { data, error } = await (supabase.from as any)("early_ape_nfts")
      .select(
        "id, post_id, token_id, entry_price, qualifying_price, minted_at, mint_status, tx_hash"
      )
      .eq("user_id", userId)
      .order("minted_at", { ascending: false });

    if (error) return { nfts: [], error: error.message };
    return { nfts: data ?? [], error: null };
  });

/**
 * Confirm on-chain mint after the user signs the BSC Testnet transaction.
 * Updates mint_status → 'minted' and stores the tx_hash for verification.
 */
export const confirmEarlyApeMint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      nftId: z.string().uuid(),
      txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid tx hash"),
    })
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context as {
      supabase: import("@supabase/supabase-js").SupabaseClient;
    };

    const { data: result, error } = await supabase.rpc("confirm_early_ape_mint", {
      _nft_id: data.nftId,
      _tx_hash: data.txHash,
    });

    if (error) return { success: false, error: error.message };
    return result as {
      success: boolean;
      tx_hash?: string;
      token_id?: number;
      error?: string;
    };
  });
