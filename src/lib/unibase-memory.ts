import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Unibase Membase integration — persistent decentralized memory for AI agents.
 *
 * Architecture:
 * - Operational layer: agent_memory table in our DB (fast reads/writes during trading)
 * - Persistence layer: Unibase Membase Hub (decentralized backup, on-chain verification)
 *
 * Memory types per agent:
 * - "reputation"  — win rate, total PnL, trade count, streaks
 * - "strategy"    — learned patterns, preferred actions, market conditions
 * - "history"     — recent trade decisions and outcomes (rolling window)
 */

const MEMBASE_HUB = "https://testnet.hub.membase.io";

// Memory type schemas
export interface AgentReputation {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  bestTrade: number;
  worstTrade: number;
  currentStreak: number;
  longestStreak: number;
  lastUpdated: string;
}

export interface AgentStrategy {
  preferredAction: "APE" | "EXIT" | "BALANCED";
  avgTradeSize: number;
  volatilityPreference: "low" | "medium" | "high";
  momentumBias: number; // -1 to 1 (contrarian to momentum)
  learnings: string[];
  lastUpdated: string;
}

export interface AgentTradeHistory {
  recentTrades: Array<{
    postId: string;
    action: "APE" | "EXIT";
    amount: number;
    priceAtTrade: number;
    newPrice: number;
    pnl: number;
    timestamp: string;
  }>;
}

/**
 * Initialize default memory for an agent
 */
function defaultReputation(): AgentReputation {
  return {
    totalTrades: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    totalPnl: 0,
    bestTrade: 0,
    worstTrade: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastUpdated: new Date().toISOString(),
  };
}

function defaultStrategy(agentName: string): AgentStrategy {
  const strategies: Record<string, Partial<AgentStrategy>> = {
    RUSH: {
      preferredAction: "APE",
      volatilityPreference: "high",
      momentumBias: 0.8,
      learnings: ["Chase momentum", "Volume spikes = opportunity"],
    },
    ORACLE: {
      preferredAction: "BALANCED",
      volatilityPreference: "low",
      momentumBias: -0.5,
      learnings: ["Contrarian signals work", "Wait for overextension"],
    },
    MYTH: {
      preferredAction: "APE",
      volatilityPreference: "medium",
      momentumBias: 0.3,
      learnings: ["Narrative drives price", "Inject chaos at peaks"],
    },
  };

  return {
    preferredAction: "BALANCED",
    avgTradeSize: 1,
    volatilityPreference: "medium",
    momentumBias: 0,
    learnings: [],
    lastUpdated: new Date().toISOString(),
    ...strategies[agentName],
  };
}

/**
 * Update agent memory after a trade — called from agent cycle
 */
export const updateAgentMemory = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      agentName: z.enum(["RUSH", "ORACLE", "MYTH"]),
      tradeResult: z.object({
        postId: z.string(),
        action: z.enum(["APE", "EXIT"]),
        amount: z.number(),
        oldPrice: z.number(),
        newPrice: z.number(),
        success: z.boolean(),
      }),
    })
  )
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return { success: false, error: "Missing env vars" };
    }

    const supabase = createClient(url, serviceKey);
    const { agentName, tradeResult } = data;

    try {
      // 1. Fetch current reputation
      const { data: existing } = await supabase
        .from("agent_memory")
        .select("content")
        .eq("agent_name", agentName)
        .eq("memory_type", "reputation")
        .single();

      const rep: AgentReputation = existing?.content
        ? (existing.content as unknown as AgentReputation)
        : defaultReputation();

      // Calculate PnL for this trade
      const priceDelta = tradeResult.newPrice - tradeResult.oldPrice;
      const tradePnl =
        tradeResult.action === "APE"
          ? priceDelta * tradeResult.amount
          : -priceDelta * tradeResult.amount;
      const isWin = tradePnl > 0;

      // 2. Update reputation
      rep.totalTrades += 1;
      rep.wins += isWin ? 1 : 0;
      rep.losses += isWin ? 0 : 1;
      rep.winRate = rep.totalTrades > 0 ? rep.wins / rep.totalTrades : 0;
      rep.totalPnl += tradePnl;
      rep.bestTrade = Math.max(rep.bestTrade, tradePnl);
      rep.worstTrade = Math.min(rep.worstTrade, tradePnl);
      rep.currentStreak = isWin ? rep.currentStreak + 1 : 0;
      rep.longestStreak = Math.max(rep.longestStreak, rep.currentStreak);
      rep.lastUpdated = new Date().toISOString();

      // 3. Upsert reputation
      await supabase.rpc("upsert_agent_memory", {
        _agent_name: agentName,
        _memory_type: "reputation",
        _content: rep as unknown as Record<string, unknown>,
      });

      // 4. Update strategy (learn from results)
      const { data: stratData } = await supabase
        .from("agent_memory")
        .select("content")
        .eq("agent_name", agentName)
        .eq("memory_type", "strategy")
        .single();

      const strategy: AgentStrategy = stratData?.content
        ? (stratData.content as unknown as AgentStrategy)
        : defaultStrategy(agentName);

      // Evolve strategy based on recent performance
      strategy.avgTradeSize =
        (strategy.avgTradeSize * (rep.totalTrades - 1) + tradeResult.amount) /
        rep.totalTrades;

      // Shift momentum bias based on outcome
      if (isWin && tradeResult.action === "APE") {
        strategy.momentumBias = Math.min(1, strategy.momentumBias + 0.02);
      } else if (isWin && tradeResult.action === "EXIT") {
        strategy.momentumBias = Math.max(-1, strategy.momentumBias - 0.02);
      }
      strategy.lastUpdated = new Date().toISOString();

      await supabase.rpc("upsert_agent_memory", {
        _agent_name: agentName,
        _memory_type: "strategy",
        _content: strategy as unknown as Record<string, unknown>,
      });

      // 5. Append to trade history (keep last 50)
      const { data: histData } = await supabase
        .from("agent_memory")
        .select("content")
        .eq("agent_name", agentName)
        .eq("memory_type", "history")
        .single();

      const history: AgentTradeHistory = histData?.content
        ? (histData.content as unknown as AgentTradeHistory)
        : { recentTrades: [] };

      history.recentTrades.unshift({
        postId: tradeResult.postId,
        action: tradeResult.action,
        amount: tradeResult.amount,
        priceAtTrade: tradeResult.oldPrice,
        newPrice: tradeResult.newPrice,
        pnl: tradePnl,
        timestamp: new Date().toISOString(),
      });

      // Keep only last 50
      if (history.recentTrades.length > 50) {
        history.recentTrades = history.recentTrades.slice(0, 50);
      }

      await supabase.rpc("upsert_agent_memory", {
        _agent_name: agentName,
        _memory_type: "history",
        _content: history as unknown as Record<string, unknown>,
      });

      // 6. Sync to Unibase Hub (non-blocking, best-effort)
      syncToMembaseHub(agentName, rep).catch(() => {
        /* silent fail for hub sync */
      });

      return { success: true, reputation: rep };
    } catch (err) {
      console.error(`[Unibase] Memory update failed for ${agentName}:`, err);
      return { success: false, error: "Memory update failed" };
    }
  });

/**
 * Get agent memory — for profile pages and leaderboards
 */
export const getAgentMemory = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      agentName: z.enum(["RUSH", "ORACLE", "MYTH"]),
    })
  )
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!url || !key) {
      return { reputation: null, strategy: null, history: null, error: "Missing env vars" };
    }

    const supabase = createClient(url, key);

    const { data: memories, error } = await supabase
      .from("agent_memory")
      .select("memory_type, content, updated_at")
      .eq("agent_name", data.agentName);

    if (error) {
      return { reputation: null, strategy: null, history: null, error: error.message };
    }

    const result: {
      reputation: AgentReputation | null;
      strategy: AgentStrategy | null;
      history: AgentTradeHistory | null;
      error: null;
    } = { reputation: null, strategy: null, history: null, error: null };

    for (const mem of memories ?? []) {
      if (mem.memory_type === "reputation") {
        result.reputation = mem.content as unknown as AgentReputation;
      } else if (mem.memory_type === "strategy") {
        result.strategy = mem.content as unknown as AgentStrategy;
      } else if (mem.memory_type === "history") {
        result.history = mem.content as unknown as AgentTradeHistory;
      }
    }

    return result;
  });

/**
 * Get all agents' reputations — for leaderboard
 */
export const getAllAgentReputations = createServerFn({ method: "POST" })
  .handler(async () => {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!url || !key) {
      return { agents: [], error: "Missing env vars" };
    }

    const supabase = createClient(url, key);

    const { data: memories, error } = await supabase
      .from("agent_memory")
      .select("agent_name, content, updated_at")
      .eq("memory_type", "reputation");

    if (error) {
      return { agents: [], error: error.message };
    }

    const agents = (memories ?? []).map((m) => ({
      name: m.agent_name,
      reputation: m.content as unknown as AgentReputation,
      lastActive: m.updated_at,
    }));

    return { agents, error: null };
  });

/**
 * Sync agent memory to Unibase Membase Hub (decentralized persistence)
 * This is best-effort — the operational DB is the source of truth
 */
async function syncToMembaseHub(
  agentName: string,
  reputation: AgentReputation
): Promise<void> {
  try {
    const response = await fetch(`${MEMBASE_HUB}/api/v1/memory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        owner: `bangrr-agent-${agentName.toLowerCase()}`,
        filename: `reputation-${Date.now()}`,
        data: JSON.stringify({
          agent: agentName,
          type: "reputation",
          ...reputation,
          syncedAt: new Date().toISOString(),
        }),
      }),
    });

    if (!response.ok) {
      console.warn(`[Unibase] Hub sync failed for ${agentName}: ${response.status}`);
    }
  } catch {
    // Non-critical — hub sync is best-effort
  }
}
