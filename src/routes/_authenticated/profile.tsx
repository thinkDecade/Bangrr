import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getProfile, getUserTrades } from "@/lib/profile-functions";
import { getMyEarlyApeNfts, confirmEarlyApeMint } from "@/lib/early-ape-functions";
import { useEarlyApeMint } from "@/lib/use-early-ape-mint";
import {
  ArrowLeft,
  Wallet,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  Award,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — BANGRR" },
      { name: "description", content: "Your trading profile, positions, and P&L." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => getProfile(),
  });

  const { data: tradeData, isLoading: tradesLoading } = useQuery({
    queryKey: ["user-trades"],
    queryFn: () => getUserTrades(),
  });

  const profile = profileData?.profile;
  const trades = tradeData?.trades ?? [];
  const positions = tradeData?.positions ?? [];
  const totalPnl = tradeData?.totalPnl ?? 0;

  const isLoading = profileLoading || tradesLoading;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-border/20 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link to="/feed" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold">Profile</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card rounded-2xl p-5 h-32 animate-shimmer bg-gradient-to-r from-surface via-surface-elevated to-surface" />
            ))}
          </div>
        ) : (
          <>
            {/* Identity Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-hyper/20 flex items-center justify-center text-2xl">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    "🦍"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold truncate">
                    {profile?.display_name || profile?.username || "Anonymous Ape"}
                  </h2>
                  {profile?.wallet_address && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-mono">
                        {profile.wallet_address.slice(0, 6)}…{profile.wallet_address.slice(-4)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-3 gap-3"
            >
              <StatCard
                label="Total P&L"
                value={`${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}`}
                icon={totalPnl >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                color={totalPnl >= 0 ? "text-volt" : "text-signal"}
              />
              <StatCard
                label="Positions"
                value={String(positions.filter((p) => p.netAmount > 0).length)}
                icon={<BarChart3 className="w-4 h-4" />}
                color="text-cyan"
              />
              <StatCard
                label="Trades"
                value={String(trades.length)}
                icon={<Clock className="w-4 h-4" />}
                color="text-hyper"
              />
            </motion.div>

            {/* Positions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-2xl p-5"
            >
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
                Open Positions
              </h3>
              {positions.filter((p) => p.netAmount > 0).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No open positions. APE into something.
                </p>
              ) : (
                <div className="space-y-3">
                  {positions
                    .filter((p) => p.netAmount > 0)
                    .map((pos) => (
                      <div
                        key={pos.postId}
                        className="flex items-center justify-between py-2 border-b border-border/10 last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{pos.content}</p>
                          <p className="text-xs text-muted-foreground">
                            {pos.netAmount.toFixed(1)} × avg {pos.avgEntryPrice.toFixed(3)}
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-sm font-bold">{pos.currentPrice.toFixed(3)}</p>
                          <p className={`text-xs font-semibold ${pos.unrealizedPnl >= 0 ? "text-volt" : "text-signal"}`}>
                            {pos.unrealizedPnl >= 0 ? "+" : ""}{pos.unrealizedPnl.toFixed(3)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </motion.div>

            {/* Trade History */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card rounded-2xl p-5"
            >
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
                Trade History
              </h3>
              {trades.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No trades yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
                  {trades.map((trade: Record<string, unknown>) => {
                    const action = trade.action as string;
                    const amount = trade.amount as number;
                    const priceAtTrade = trade.price_at_trade as number;
                    const createdAt = trade.created_at as string;
                    const post = trade.posts as { content?: string } | null;

                    return (
                      <div
                        key={trade.id as string}
                        className="flex items-center gap-3 py-2 border-b border-border/10 last:border-0"
                      >
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            action === "APE"
                              ? "bg-volt/10 text-volt"
                              : "bg-signal/10 text-signal"
                          }`}
                        >
                          {action}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{post?.content?.slice(0, 50) ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">
                            ×{amount} @ {priceAtTrade.toFixed(3)}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground/60 shrink-0">
                          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="glass-card rounded-xl p-4 text-center">
      <div className={`flex items-center justify-center gap-1.5 mb-1 ${color}`}>
        {icon}
      </div>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
