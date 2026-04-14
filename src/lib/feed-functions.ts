import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getPosts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      cursor: z.string().optional(),
      limit: z.number().min(1).max(50).default(20),
    })
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let query = supabase
      .from("posts")
      .select(
        `
        *,
        profiles!posts_creator_id_fkey (
          id, username, display_name, avatar_url
        )
      `
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (data.cursor) {
      query = query.lt("created_at", data.cursor);
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error("getPosts error:", error);
      return { posts: [], nextCursor: null, error: error.message };
    }

    const nextCursor =
      posts && posts.length === data.limit
        ? posts[posts.length - 1].created_at
        : null;

    return { posts: posts ?? [], nextCursor, error: null };
  });

export const getPostsPublic = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      cursor: z.string().optional(),
      limit: z.number().min(1).max(50).default(20),
    })
  )
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!url || !key) {
      return { posts: [], nextCursor: null, error: "Missing env vars" };
    }

    const supabase = createClient(url, key);

    let query = supabase
      .from("posts")
      .select(
        `
        *,
        profiles!posts_creator_id_fkey (
          id, username, display_name, avatar_url
        )
      `
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (data.cursor) {
      query = query.lt("created_at", data.cursor);
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error("getPostsPublic error:", error);
      return { posts: [], nextCursor: null, error: error.message };
    }

    const nextCursor =
      posts && posts.length === data.limit
        ? posts[posts.length - 1].created_at
        : null;

    return { posts: posts ?? [], nextCursor, error: null };
  });

export const createPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      content: z.string().min(1).max(280),
    })
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        creator_id: userId,
        content: data.content,
        current_price: 1.0,
        price_change_pct: 0,
        volume: 0,
      })
      .select(
        `
        *,
        profiles!posts_creator_id_fkey (
          id, username, display_name, avatar_url
        )
      `
      )
      .single();

    if (error) {
      console.error("createPost error:", error);
      return { post: null, error: error.message };
    }

    // Log activity
    await supabase.from("activity_feed").insert({
      actor_type: "user",
      actor_name: userId,
      action: "DROPPED",
      post_id: post.id,
      metadata: { content: data.content.slice(0, 50) },
    });

    return { post, error: null };
  });

export const executeTrade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      postId: z.string().uuid(),
      action: z.enum(["APE", "EXIT"]),
      amount: z.number().min(0.01).max(10000),
    })
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Get current post
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("*")
      .eq("id", data.postId)
      .single();

    if (postError || !post) {
      return { success: false, error: "Post not found" };
    }

    const currentPrice = post.current_price ?? 1;
    const priceImpact = data.action === "APE" ? 0.05 : -0.05;
    const newPrice = Math.max(0.01, currentPrice * (1 + priceImpact * data.amount));
    const pricePct = ((newPrice - currentPrice) / currentPrice) * 100;

    // Insert trade
    const { error: tradeError } = await supabase.from("trades").insert({
      user_id: userId,
      post_id: data.postId,
      action: data.action,
      amount: data.amount,
      price_at_trade: currentPrice,
    });

    if (tradeError) {
      console.error("trade insert error:", tradeError);
      return { success: false, error: tradeError.message };
    }

    // Update post price (only creator can update due to RLS, so use service role approach)
    // Since RLS restricts UPDATE to creator, we'll insert price_history and activity
    // The price update will be handled by the post creator's context
    // For now, log the price history
    await supabase.from("price_history").insert({
      post_id: data.postId,
      price: newPrice,
    });

    // Log activity
    await supabase.from("activity_feed").insert({
      actor_type: "user",
      actor_name: userId,
      action: data.action,
      post_id: data.postId,
      metadata: {
        amount: data.amount,
        price: currentPrice,
        new_price: newPrice,
      },
    });

    return {
      success: true,
      error: null,
      newPrice,
      priceChangePct: pricePct,
    };
  });

export const getActivityFeed = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      limit: z.number().min(1).max(100).default(30),
    })
  )
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!url || !key) {
      return { activities: [], error: "Missing env vars" };
    }

    const supabase = createClient(url, key);

    const { data: activities, error } = await supabase
      .from("activity_feed")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (error) {
      console.error("getActivityFeed error:", error);
      return { activities: [], error: error.message };
    }

    return { activities: activities ?? [], error: null };
  });
