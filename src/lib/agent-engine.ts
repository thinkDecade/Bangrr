import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Agent personalities and trading strategies
const AGENTS = {
  RUSH: {
    name: "RUSH",
    emoji: "⚡",
    style: "aggressive momentum trader",
    bias: "APE" as const, // tends to buy
    minAmount: 1,
    maxAmount: 10,
    tradeChance: 0.7, // 70% chance to trade each post
  },
  ORACLE: {
    name: "ORACLE",
    emoji: "👁",
    style: "contrarian value seeker",
    bias: null, // balanced
    minAmount: 2,
    maxAmount: 8,
    tradeChance: 0.4, // 40% — selective
  },
  MYTH: {
    name: "MYTH",
    emoji: "🌀",
    style: "chaotic narrative trader",
    bias: null, // random
    minAmount: 0.5,
    maxAmount: 15,
    tradeChance: 0.5,
  },
} as const;

type AgentName = keyof typeof AGENTS;

interface PostForAgent {
  id: string;
  current_price: number | null;
  price_change_pct: number | null;
  volume: number | null;
  content: string;
}

function decideAction(
  agent: (typeof AGENTS)[AgentName],
  post: PostForAgent
): { action: "APE" | "EXIT"; amount: number } | null {
  // Random chance to skip
  if (Math.random() > agent.tradeChance) return null;

  const price = post.current_price ?? 1;
  const changePct = post.price_change_pct ?? 0;

  let action: "APE" | "EXIT";

  if (agent.name === "RUSH") {
    // RUSH: momentum — apes rising posts, exits falling
    action = changePct >= 0 ? "APE" : "EXIT";
    // But sometimes FOMO apes hard even on dips
    if (changePct < -5 && Math.random() > 0.7) action = "APE";
  } else if (agent.name === "ORACLE") {
    // ORACLE: contrarian — buys dips, sells peaks
    if (changePct > 5) action = "EXIT";
    else if (changePct < -3) action = "APE";
    else action = Math.random() > 0.5 ? "APE" : "EXIT";
  } else {
    // MYTH: chaos — pure random with slight preference for drama
    action = Math.random() > 0.45 ? "APE" : "EXIT";
    // If price is very low, more likely to ape (narrative play)
    if (price < 0.5) action = "APE";
    // If price is very high, might exit for drama
    if (price > 5 && Math.random() > 0.6) action = "EXIT";
  }

  // Don't exit if price is already very low
  if (action === "EXIT" && price <= 0.05) action = "APE";

  // Random amount within agent range
  const range = agent.maxAmount - agent.minAmount;
  const amount = Math.round((agent.minAmount + Math.random() * range) * 10) / 10;

  return { action, amount };
}

// Server function to run all agents once
export const runAgentCycle = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      maxPosts: z.number().min(1).max(20).default(5),
    })
  )
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");

    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return { results: [], error: "Missing env vars" };
    }

    // Use service role to call agent_process_trade (SECURITY DEFINER)
    const supabase = createClient(url, serviceKey);

    // Get active posts
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("id, current_price, price_change_pct, volume, content")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(data.maxPosts);

    if (postsError || !posts?.length) {
      return { results: [], error: postsError?.message ?? "No active posts" };
    }

    const results: Array<{
      agent: string;
      postId: string;
      action: string;
      amount: number;
      success: boolean;
      newPrice?: number;
    }> = [];

    // Each agent evaluates each post
    for (const agentKey of Object.keys(AGENTS) as AgentName[]) {
      const agent = AGENTS[agentKey];

      for (const post of posts) {
        const decision = decideAction(agent, post as PostForAgent);
        if (!decision) continue;

        const { data: result, error } = await supabase.rpc(
          "agent_process_trade",
          {
            _agent_name: agent.name,
            _post_id: post.id,
            _action: decision.action,
            _amount: decision.amount,
          }
        );

        if (error) {
          console.error(`Agent ${agent.name} trade error:`, error);
          continue;
        }

        const parsed = result as {
          success: boolean;
          new_price?: number;
        };

        results.push({
          agent: agent.name,
          postId: post.id,
          action: decision.action,
          amount: decision.amount,
          success: parsed.success,
          newPrice: parsed.new_price,
        });

        // Small delay between agent trades to spread them out
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    return { results, error: null };
  });
