import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { getAgentStats } from "@/lib/agent-stats-functions";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, TrendingDown, Zap, Target, BarChart3 } from "lucide-react";

const rankColors = [
  "from-amber-400/20 to-amber-600/5 border-amber-500/30",
  "from-zinc-300/15 to-zinc-500/5 border-zinc-400/25",
  "from-orange-400/15 to-orange-600/5 border-orange-500/25",
];

const rankBadges = ["🥇", "🥈", "🥉"];

export function AgentWarsLeaderboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["agent-wars"],
    queryFn: () => getAgentStats(),
    refetchInterval: 30000,
  });

  const agents = data?.agents ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Trophy className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
          Agent Wars
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground ml-auto">
          LIVE RANKINGS
        </span>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-surface animate-pulse"
            />
          ))}
        </div>
      )}

      {agents.map((agent, i) => (
        <Link key={agent.name} to="/agent/$agentName" params={{ agentName: agent.name }}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className={`relative rounded-xl border bg-gradient-to-r p-3 cursor-pointer hover:brightness-110 transition ${rankColors[i] ?? "border-border/20 from-surface to-surface"}`}
        >
          {/* Rank + Agent name */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{rankBadges[i] ?? `#${i + 1}`}</span>
              <span className="text-lg">{agent.emoji}</span>
              <span className="font-black text-sm tracking-tight text-foreground">
                {agent.name}
              </span>
            </div>
            <div
              className={`flex items-center gap-1 text-sm font-bold font-mono ${
                agent.totalPnl >= 0 ? "text-volt" : "text-signal"
              }`}
            >
              {agent.totalPnl >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {agent.totalPnl >= 0 ? "+" : ""}
              {agent.totalPnl.toFixed(1)}% P&L
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-2 text-[10px] font-mono">
            <div className="flex flex-col items-center gap-0.5 rounded-lg bg-background/30 p-1.5">
              <Zap className="w-3 h-3 text-hyper" />
              <span className="text-muted-foreground">TRADES</span>
              <span className="text-foreground font-bold text-xs">
                {agent.totalTrades}
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5 rounded-lg bg-background/30 p-1.5">
              <Target className="w-3 h-3 text-cyan" />
              <span className="text-muted-foreground">WIN%</span>
              <span className="text-foreground font-bold text-xs">
                {agent.winRate}%
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5 rounded-lg bg-background/30 p-1.5">
              <TrendingUp className="w-3 h-3 text-volt" />
              <span className="text-muted-foreground">APE</span>
              <span className="text-foreground font-bold text-xs">
                {agent.apeCount}
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5 rounded-lg bg-background/30 p-1.5">
              <BarChart3 className="w-3 h-3 text-alert" />
              <span className="text-muted-foreground">VOL</span>
              <span className="text-foreground font-bold text-xs">
                {agent.totalVolume.toFixed(0)}
              </span>
            </div>
          </div>

          {/* Last action */}
          <div className="mt-1.5 text-[10px] font-mono text-muted-foreground truncate">
            Last: {agent.lastAction}
          </div>
        </motion.div>
      ))}

      {!isLoading && agents.length > 0 && agents.every((a) => a.totalTrades === 0) && (
        <p className="text-xs text-muted-foreground font-mono text-center py-2">
          No agent trades yet. Hit RUN AGENTS to start the war.
        </p>
      )}
    </div>
  );
}
