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

    // Insert initial price history point
    await supabase.from("price_history").insert({
      post_id: post.id,
      price: 1.0,
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
    const { supabase } = context;

    // Call the atomic process_trade DB function
    const { data: result, error } = await supabase.rpc("process_trade", {
      _post_id: data.postId,
      _action: data.action,
      _amount: data.amount,
    });

    if (error) {
      console.error("executeTrade RPC error:", error);
      return { success: false, error: error.message, newPrice: 0, priceChangePct: 0, volume: 0 };
    }

    const parsed = result as {
      success: boolean;
      error?: string;
      old_price?: number;
      new_price?: number;
      price_change_pct?: number;
      volume?: number;
    };

    if (!parsed.success) {
      return { success: false, error: parsed.error ?? "Trade failed", newPrice: 0, priceChangePct: 0, volume: 0 };
    }

    return {
      success: true,
      error: null,
      newPrice: parsed.new_price ?? 0,
      priceChangePct: parsed.price_change_pct ?? 0,
      volume: parsed.volume ?? 0,
      oldPrice: parsed.old_price ?? 0,
    };
  });

export const getPriceHistory = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      postIds: z.array(z.string().uuid()).min(1).max(50),
      limit: z.number().min(1).max(50).default(20),
    })
  )
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!url || !key) {
      return { priceHistory: {}, error: "Missing env vars" };
    }

    const supabase = createClient(url, key);

    const { data: records, error } = await supabase
      .from("price_history")
      .select("post_id, price, recorded_at")
      .in("post_id", data.postIds)
      .order("recorded_at", { ascending: true })
      .limit(data.limit * data.postIds.length);

    if (error) {
      console.error("getPriceHistory error:", error);
      return { priceHistory: {}, error: error.message };
    }

    // Group by post_id, keep last N per post
    const grouped: Record<string, number[]> = {};
    for (const r of records ?? []) {
      if (!grouped[r.post_id]) grouped[r.post_id] = [];
      grouped[r.post_id].push(r.price);
    }

    // Trim to limit per post
    for (const key of Object.keys(grouped)) {
      if (grouped[key].length > data.limit) {
        grouped[key] = grouped[key].slice(-data.limit);
      }
    }

    return { priceHistory: grouped, error: null };
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

export const executeRotation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      fromPostId: z.string().uuid(),
      toPostId: z.string().uuid(),
      amount: z.number().min(0.01).max(10000),
    })
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: result, error } = await supabase.rpc("process_rotation", {
      _from_post_id: data.fromPostId,
      _to_post_id: data.toPostId,
      _amount: data.amount,
    });

    if (error) {
      console.error("executeRotation RPC error:", error);
      return { success: false, error: error.message };
    }

    const parsed = result as {
      success: boolean;
      error?: string;
      from_new_price?: number;
      to_new_price?: number;
    };

    if (!parsed.success) {
      return { success: false, error: parsed.error ?? "Rotation failed" };
    }

    return { success: true, error: null };
  });
