import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const summonAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    postId: z.string().uuid(),
    agentName: z.enum(["RUSH", "ORACLE", "MYTH"]),
    ritualType: z.enum(["amplify", "protect", "destroy"]).default("amplify"),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Insert summon request
    const { error: insertErr } = await (supabase.from as any)("agent_summons").insert({
      user_id: userId,
      post_id: data.postId,
      agent_name: data.agentName,
      ritual_type: data.ritualType,
    });

    if (insertErr) return { success: false, error: insertErr.message };

    // Auto-process: agent decides whether to accept (70% chance)
    const accepted = Math.random() < 0.7;

    if (accepted) {
      // Execute the agent trade via service role
      const { createClient } = await import("@supabase/supabase-js");
      const url = process.env.SUPABASE_URL;
      const sKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !sKey) return { success: true, accepted: false, error: null };

      const admin = createClient(url, sKey);

      // Determine action based on ritual type
      const actionMap = { amplify: "APE", protect: "APE", destroy: "EXIT" } as const;
      const action = actionMap[data.ritualType];
      const amount = data.ritualType === "destroy" ? 5 + Math.random() * 10 : 2 + Math.random() * 5;

      const { data: result } = await admin.rpc("agent_process_trade", {
        _agent_name: data.agentName,
        _post_id: data.postId,
        _action: action,
        _amount: Math.round(amount * 10) / 10,
      });

      // Log the summon
      await admin.from("activity_feed").insert({
        actor_type: "system",
        actor_name: data.agentName,
        action: "SUMMONED",
        post_id: data.postId,
        metadata: {
          summoner: userId,
          ritual: data.ritualType,
          accepted: true,
          trade_action: action,
          amount: Math.round(amount * 10) / 10,
        },
      });

      return { success: true, accepted: true, action, error: null };
    }

    // Agent rejected the summon
    const { createClient: cc } = await import("@supabase/supabase-js");
    const url2 = process.env.SUPABASE_URL;
    const sKey2 = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url2 && sKey2) {
      const admin2 = cc(url2, sKey2);
      await admin2.from("activity_feed").insert({
        actor_type: "system",
        actor_name: data.agentName,
        action: "SUMMON_REJECTED",
        post_id: data.postId,
        metadata: { summoner: userId, ritual: data.ritualType, accepted: false },
      });
    }

    return { success: true, accepted: false, error: null };
  });

export const getPostSummons = createServerFn({ method: "POST" })
  .inputValidator(z.object({ postId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return { summons: [], error: "Missing env vars" };
    const supabase = createClient(url, key);

    const { data: summons, error } = await (supabase.from as any)("agent_summons")
      .select("*")
      .eq("post_id", data.postId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) return { summons: [], error: error.message };
    return { summons: summons ?? [], error: null };
  });
