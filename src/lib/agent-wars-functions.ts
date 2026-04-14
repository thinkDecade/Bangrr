import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getActiveWars = createServerFn({ method: "POST" })
  .handler(async () => {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return { wars: [], error: "Missing env vars" };
    const supabase = createClient(url, key);

    const { data: wars, error } = await (supabase.from as any)("agent_wars")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) return { wars: [], error: error.message };
    return { wars: wars ?? [], error: null };
  });

export const voteInWar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    warId: z.string().uuid(),
    side: z.enum(["RUSH", "ORACLE", "MYTH"]),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Insert vote (unique constraint handles duplicates)
    const { error } = await (supabase.from as any)("agent_war_votes").insert({
      war_id: data.warId,
      user_id: userId,
      side: data.side,
    });

    if (error) {
      if (error.code === "23505") return { success: false, error: "Already voted" };
      return { success: false, error: error.message };
    }

    // Update vote count on the war using service role
    const { createClient } = await import("@supabase/supabase-js");
    const sUrl = process.env.SUPABASE_URL;
    const sKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (sUrl && sKey) {
      const admin = createClient(sUrl, sKey);
      const col = `community_${data.side.toLowerCase()}_votes`;
      // Get current count and increment
      const { data: war } = await (admin.from as any)("agent_wars").select(col).eq("id", data.warId).single();
      if (war) {
        await (admin.from as any)("agent_wars").update({ [col]: (war[col] ?? 0) + 1 }).eq("id", data.warId);
      }
    }

    return { success: true, error: null };
  });

export const startAgentWar = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    postId: z.string().uuid(),
    challenger: z.enum(["RUSH", "ORACLE", "MYTH"]),
    defender: z.enum(["RUSH", "ORACLE", "MYTH"]),
  }))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return { war: null, error: "Missing env vars" };
    const supabase = createClient(url, key);

    // Get current post price
    const { data: post } = await supabase.from("posts").select("current_price").eq("id", data.postId).single();
    if (!post) return { war: null, error: "Post not found" };

    const entryPrice = post.current_price ?? 1;
    const challengerAction = Math.random() > 0.5 ? "APE" : "EXIT";
    const defenderAction = challengerAction === "APE" ? "EXIT" : "APE";

    const { data: war, error } = await (supabase.from as any)("agent_wars").insert({
      post_id: data.postId,
      challenger: data.challenger,
      defender: data.defender,
      challenger_action: challengerAction,
      defender_action: defenderAction,
      challenger_amount: 3 + Math.random() * 7,
      defender_amount: 3 + Math.random() * 7,
      entry_price: entryPrice,
    }).select().single();

    if (error) return { war: null, error: error.message };

    // Log activity
    await supabase.from("activity_feed").insert({
      actor_type: "system",
      actor_name: "AGENT_WARS",
      action: "WAR_STARTED",
      post_id: data.postId,
      metadata: { challenger: data.challenger, defender: data.defender, entry_price: entryPrice },
    });

    return { war, error: null };
  });

export const resolveAgentWar = createServerFn({ method: "POST" })
  .inputValidator(z.object({ warId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return { result: null, error: "Missing env vars" };
    const supabase = createClient(url, key);

    const { data: war } = await (supabase.from as any)("agent_wars").select("*").eq("id", data.warId).single();
    if (!war || war.status !== "active") return { result: null, error: "War not found or already resolved" };

    const { data: post } = await supabase.from("posts").select("current_price").eq("id", war.post_id).single();
    if (!post) return { result: null, error: "Post not found" };

    const currentPrice = post.current_price ?? 1;
    const priceMove = currentPrice - war.entry_price;

    // Challenger wins if price moved in their direction
    let winner: string;
    if (war.challenger_action === "APE") {
      winner = priceMove > 0 ? war.challenger : war.defender;
    } else {
      winner = priceMove < 0 ? war.challenger : war.defender;
    }

    await (supabase.from as any)("agent_wars").update({
      status: "resolved",
      winner,
      resolved_price: currentPrice,
      resolved_at: new Date().toISOString(),
    }).eq("id", data.warId);

    // Log activity
    await supabase.from("activity_feed").insert({
      actor_type: "system",
      actor_name: "AGENT_WARS",
      action: "WAR_RESOLVED",
      post_id: war.post_id,
      metadata: { winner, loser: winner === war.challenger ? war.defender : war.challenger, resolved_price: currentPrice },
    });

    return { result: { winner, resolvedPrice: currentPrice }, error: null };
  });
