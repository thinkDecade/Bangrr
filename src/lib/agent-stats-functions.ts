import { createServerFn } from "@tanstack/react-start";

export const getAgentStats = createServerFn({ method: "POST" })
  .handler(async () => {
    const { createClient } = await import("@supabase/supabase-js");

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!url || !key) {
      return { agents: [], error: "Missing env vars" };
    }

    const supabase = createClient(url, key);

    // Get all agent activity
    const { data: activities, error } = await supabase
      .from("activity_feed")
      .select("actor_name, action, metadata, created_at")
      .eq("actor_type", "agent")
      .in("actor_name", ["RUSH", "ORACLE", "MYTH"])
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      console.error("getAgentStats error:", error);
      return { agents: [], error: error.message };
    }

    const agentNames = ["RUSH", "ORACLE", "MYTH"] as const;
    const agentEmojis: Record<string, string> = {
      RUSH: "⚡",
      ORACLE: "👁",
      MYTH: "🌀",
    };

    const agents = agentNames.map((name) => {
      const trades = (activities ?? []).filter((a) => a.actor_name === name);
      const apes = trades.filter((t) => t.action === "APE");
      const exits = trades.filter((t) => t.action === "EXIT");

      // Calculate P&L from metadata
      let totalPnl = 0;
      let wins = 0;

      for (const trade of trades) {
        const meta = trade.metadata as Record<string, number> | null;
        if (meta?.price_change_pct) {
          const pnl = meta.price_change_pct;
          totalPnl += pnl;
          if (
            (trade.action === "APE" && pnl > 0) ||
            (trade.action === "EXIT" && pnl < 0)
          ) {
            wins++;
          }
        }
      }

      const totalVolume = trades.reduce((sum, t) => {
        const meta = t.metadata as Record<string, number> | null;
        return sum + (meta?.amount ?? 0);
      }, 0);

      const lastTrade = trades[0];

      return {
        name,
        emoji: agentEmojis[name],
        totalTrades: trades.length,
        apeCount: apes.length,
        exitCount: exits.length,
        totalPnl: Math.round(totalPnl * 100) / 100,
        winRate:
          trades.length > 0
            ? Math.round((wins / trades.length) * 100)
            : 0,
        totalVolume: Math.round(totalVolume * 100) / 100,
        lastAction: lastTrade
          ? `${lastTrade.action} @ ${new Date(lastTrade.created_at).toLocaleTimeString()}`
          : "No trades yet",
      };
    });

    // Sort by P&L descending
    agents.sort((a, b) => b.totalPnl - a.totalPnl);

    return { agents, error: null };
  });
