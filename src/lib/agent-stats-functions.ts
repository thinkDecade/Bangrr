import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

function createSupabase() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require("@supabase/supabase-js");
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export const getAgentStats = createServerFn({ method: "POST" })
  .handler(async () => {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return { agents: [], error: "Missing env vars" };
    const supabase = createClient(url, key);

    const { data: activities, error } = await supabase
      .from("activity_feed")
      .select("actor_name, action, metadata, created_at")
      .eq("actor_type", "agent")
      .in("actor_name", ["RUSH", "ORACLE", "MYTH"])
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) return { agents: [], error: error.message };

    const agentNames = ["RUSH", "ORACLE", "MYTH"] as const;
    const agentEmojis: Record<string, string> = { RUSH: "⚡", ORACLE: "👁", MYTH: "🌀" };

    const agents = agentNames.map((name) => {
      const trades = (activities ?? []).filter((a) => a.actor_name === name);
      const apes = trades.filter((t) => t.action === "APE");
      const exits = trades.filter((t) => t.action === "EXIT");
      let totalPnl = 0;
      let wins = 0;
      for (const trade of trades) {
        const meta = trade.metadata as Record<string, number> | null;
        if (meta?.price_change_pct) {
          const pnl = meta.price_change_pct;
          totalPnl += pnl;
          if ((trade.action === "APE" && pnl > 0) || (trade.action === "EXIT" && pnl < 0)) wins++;
        }
      }
      const totalVolume = trades.reduce((sum, t) => {
        const meta = t.metadata as Record<string, number> | null;
        return sum + (meta?.amount ?? 0);
      }, 0);
      const lastTrade = trades[0];
      return {
        name, emoji: agentEmojis[name],
        totalTrades: trades.length, apeCount: apes.length, exitCount: exits.length,
        totalPnl: Math.round(totalPnl * 100) / 100,
        winRate: trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0,
        totalVolume: Math.round(totalVolume * 100) / 100,
        lastAction: lastTrade ? `${lastTrade.action} @ ${new Date(lastTrade.created_at).toLocaleTimeString()}` : "No trades yet",
      };
    });
    agents.sort((a, b) => b.totalPnl - a.totalPnl);
    return { agents, error: null };
  });

export const getAgentProfile = createServerFn({ method: "POST" })
  .inputValidator(z.object({ agentName: z.enum(["RUSH", "ORACLE", "MYTH"]) }))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return { profile: null, error: "Missing env vars" };
    const supabase = createClient(url, key);

    // Get all trades for this agent
    const { data: activities, error } = await supabase
      .from("activity_feed")
      .select("*")
      .eq("actor_type", "agent")
      .eq("actor_name", data.agentName)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) return { profile: null, error: error.message };

    const trades = activities ?? [];

    // Compute stats
    let totalPnl = 0;
    let wins = 0;
    let biggestWin = 0;
    let biggestLoss = 0;
    let totalVolume = 0;
    const pnlOverTime: { time: string; pnl: number }[] = [];
    let cumulativePnl = 0;

    // Process in chronological order for chart
    const chronological = [...trades].reverse();
    for (const trade of chronological) {
      const meta = trade.metadata as Record<string, number> | null;
      const pnl = meta?.price_change_pct ?? 0;
      const amount = meta?.amount ?? 0;
      totalPnl += pnl;
      totalVolume += amount;
      cumulativePnl += pnl;

      if ((trade.action === "APE" && pnl > 0) || (trade.action === "EXIT" && pnl < 0)) wins++;
      if (pnl > biggestWin) biggestWin = pnl;
      if (pnl < biggestLoss) biggestLoss = pnl;

      pnlOverTime.push({
        time: new Date(trade.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        pnl: Math.round(cumulativePnl * 100) / 100,
      });
    }

    // Action distribution
    const apeCount = trades.filter((t) => t.action === "APE").length;
    const exitCount = trades.filter((t) => t.action === "EXIT").length;

    // Recent trades (most recent first, limit 20)
    const recentTrades = trades.slice(0, 20).map((t) => {
      const meta = t.metadata as Record<string, number> | null;
      return {
        id: t.id,
        action: t.action,
        amount: meta?.amount ?? 0,
        oldPrice: meta?.old_price ?? 0,
        newPrice: meta?.new_price ?? 0,
        pnlPct: meta?.price_change_pct ?? 0,
        time: t.created_at,
        postId: t.post_id,
      };
    });

    // Avg trade size
    const avgTradeSize = trades.length > 0 ? totalVolume / trades.length : 0;

    const descriptions: Record<string, string> = {
      RUSH: "Momentum hunter. APEs hard into rising posts, exits fast on weakness. High frequency, high conviction.",
      ORACLE: "Pattern reader. Analyzes price history and volume to find undervalued posts. Calculated entries, surgical exits.",
      MYTH: "Chaos agent. Random strategy that occasionally catches massive moves. Unpredictable and dangerous.",
    };

    const strategies: Record<string, { name: string; detail: string }[]> = {
      RUSH: [
        { name: "Momentum Chase", detail: "Targets posts with >5% recent price increase" },
        { name: "Quick Exit", detail: "Sells within minutes if momentum stalls" },
        { name: "Volume Surge", detail: "Increases position size on high-volume posts" },
      ],
      ORACLE: [
        { name: "Value Detection", detail: "Finds posts trading below intrinsic attention value" },
        { name: "Trend Reversal", detail: "Exits positions showing distribution patterns" },
        { name: "Risk Management", detail: "Never allocates >30% to a single post" },
      ],
      MYTH: [
        { name: "Random Entry", detail: "Enters positions based on chaos theory signals" },
        { name: "Contrarian Plays", detail: "Sometimes buys what others are selling" },
        { name: "Full Send", detail: "Occasionally goes all-in on a single conviction" },
      ],
    };

    return {
      profile: {
        name: data.agentName,
        emoji: { RUSH: "⚡", ORACLE: "👁", MYTH: "🌀" }[data.agentName],
        description: descriptions[data.agentName],
        strategies: strategies[data.agentName],
        stats: {
          totalTrades: trades.length,
          apeCount,
          exitCount,
          totalPnl: Math.round(totalPnl * 100) / 100,
          winRate: trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0,
          totalVolume: Math.round(totalVolume * 100) / 100,
          avgTradeSize: Math.round(avgTradeSize * 100) / 100,
          biggestWin: Math.round(biggestWin * 100) / 100,
          biggestLoss: Math.round(biggestLoss * 100) / 100,
        },
        pnlOverTime,
        recentTrades,
      },
      error: null,
    };
  });
