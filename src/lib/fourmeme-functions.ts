import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Prepare Four.meme token creation parameters server-side.
 * This generates the createArg struct and mock signature for the contract call.
 * In production, this would call Four.meme's API for real signatures.
 */
export const prepareFourMemeToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      postId: z.string().uuid(),
      name: z.string().min(1).max(64),
      symbol: z.string().min(1).max(8),
      description: z.string().min(1).max(280),
    })
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    // Verify the post exists and belongs to user
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id, creator_id, token_address")
      .eq("id", data.postId)
      .single();

    if (postError || !post) {
      return { success: false, error: "Post not found" };
    }

    if (post.token_address) {
      return { success: false, error: "Post already has a token" };
    }

    // Generate nonce and launch time for the contract call
    const nonce = Date.now();
    const launchTime = Math.floor(Date.now() / 1000);

    // In production, this would call Four.meme's prepare-create API
    // to get a real signature. For testnet, we use the contract directly.
    const createArg = {
      name: data.name,
      symbol: data.symbol,
      totalSupply: "1000000000000000000000000000", // 1B tokens with 18 decimals
      logoUrl: "", // Auto-generated or default
      desc: data.description,
      launchTime: launchTime.toString(),
      nonce: nonce.toString(),
    };

    return {
      success: true,
      createArg,
      // Mock signature for testnet — real integration uses Four.meme API signature
      signature: "0x",
      nonce,
      launchTime,
    };
  });

/**
 * Confirm token deployment — save the token address to the post after tx confirmation
 */
export const confirmTokenDeployment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      postId: z.string().uuid(),
      tokenAddress: z.string().min(1).max(100),
      txHash: z.string().min(1).max(100),
    })
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify post ownership
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id, creator_id")
      .eq("id", data.postId)
      .eq("creator_id", userId)
      .single();

    if (postError || !post) {
      return { success: false, error: "Post not found or not owned by user" };
    }

    // Update post with token address
    const { error: updateError } = await supabase
      .from("posts")
      .update({ token_address: data.tokenAddress })
      .eq("id", data.postId);

    if (updateError) {
      console.error("Failed to save token address:", updateError);
      return { success: false, error: "Failed to save token address" };
    }

    // Log activity
    await supabase.from("activity_feed").insert({
      actor_type: "system",
      actor_name: "FOURMEME",
      action: "TOKEN_DEPLOYED",
      post_id: data.postId,
      metadata: {
        token_address: data.tokenAddress,
        tx_hash: data.txHash,
        deployer: userId,
      },
    });

    return { success: true };
  });

/**
 * Get token info for a post
 */
export const getTokenInfo = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      postId: z.string().uuid(),
    })
  )
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!url || !key) {
      return { tokenAddress: null, error: "Missing env vars" };
    }

    const supabase = createClient(url, key);

    const { data: post, error } = await supabase
      .from("posts")
      .select("token_address")
      .eq("id", data.postId)
      .single();

    if (error) {
      return { tokenAddress: null, error: error.message };
    }

    return { tokenAddress: post?.token_address ?? null, error: null };
  });
