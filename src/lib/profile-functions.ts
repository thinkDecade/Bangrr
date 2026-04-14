import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    return { profile: profile ?? null };
  });

export const getUserTrades = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: trades, error } = await supabase
      .from("trades")
      .select(`
        *,
        posts!trades_post_id_fkey (
          id, content, current_price, is_active
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("getUserTrades error:", error);
      return { trades: [], positions: [], totalPnl: 0 };
    }

    // Compute positions: group by post, calculate avg entry and unrealized P&L
    const positionMap: Record<string, {
      postId: string;
      content: string;
      currentPrice: number;
      isActive: boolean;
      totalAped: number;
      totalExited: number;
      netAmount: number;
      avgEntryPrice: number;
      unrealizedPnl: number;
      tradeCount: number;
    }> = {};

    for (const trade of trades ?? []) {
      const postId = trade.post_id;
      const post = trade.posts as { id: string; content: string; current_price: number | null; is_active: boolean | null } | null;

      if (!positionMap[postId]) {
        positionMap[postId] = {
          postId,
          content: post?.content?.slice(0, 60) ?? "Unknown",
          currentPrice: post?.current_price ?? 1,
          isActive: post?.is_active ?? false,
          totalAped: 0,
          totalExited: 0,
          netAmount: 0,
          avgEntryPrice: 0,
          unrealizedPnl: 0,
          tradeCount: 0,
        };
      }

      const pos = positionMap[postId];
      pos.tradeCount++;

      if (trade.action === "APE") {
        pos.totalAped += trade.amount;
        // Weighted average entry
        const prevTotal = pos.avgEntryPrice * (pos.totalAped - trade.amount);
        pos.avgEntryPrice = (prevTotal + trade.price_at_trade * trade.amount) / pos.totalAped;
      } else {
        pos.totalExited += trade.amount;
      }
    }

    // Calculate net and unrealized P&L
    const positions = Object.values(positionMap).map((pos) => {
      pos.netAmount = pos.totalAped - pos.totalExited;
      if (pos.netAmount > 0 && pos.avgEntryPrice > 0) {
        pos.unrealizedPnl = (pos.currentPrice - pos.avgEntryPrice) * pos.netAmount;
      }
      return pos;
    }).filter((p) => p.netAmount > 0 || p.tradeCount > 0);

    const totalPnl = positions.reduce((sum, p) => sum + p.unrealizedPnl, 0);

    return {
      trades: trades ?? [],
      positions: positions.sort((a, b) => Math.abs(b.unrealizedPnl) - Math.abs(a.unrealizedPnl)),
      totalPnl,
    };
  });
