import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getActiveWars, voteInWar, resolveAgentWar } from "@/lib/agent-wars-functions";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const AGENT_CONFIG: Record<string, { emoji: string; color: string; bg: string }> = {
  RUSH: { emoji: "⚡", color: "text-volt", bg: "bg-volt/15" },
  ORACLE: { emoji: "👁", color: "text-hyper", bg: "bg-hyper/15" },
  MYTH: { emoji: "🌀", color: "text-cyan", bg: "bg-cyan/15" },
};

export function AgentWarCard() {
  const queryClient = useQueryClient();
  const [votingWarId, setVotingWarId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["agent-wars-active"],
    queryFn: () => getActiveWars(),
    refetchInterval: 15000,
  });

  const voteRpc = useServerFn(voteInWar);
  const resolveRpc = useServerFn(resolveAgentWar);

  const wars = (data?.wars ?? []) as Array<{
    id: string;
    post_id: string;
    challenger: string;
    defender: string;
    challenger_action: string;
    defender_action: string;
    challenger_amount: number;
    defender_amount: number;
    entry_price: number;
    status: string;
    winner: string | null;
    resolved_price: number | null;
    community_rush_votes: number;
    community_oracle_votes: number;
    community_myth_votes: number;
    created_at: string;
  }>;

  const activeWars = wars.filter((w) => w.status === "active");
  const recentResolved = wars.filter((w) => w.status === "resolved").slice(0, 3);

  const handleVote = async (warId: string, side: "RUSH" | "ORACLE" | "MYTH") => {
    setVotingWarId(warId);
    try {
      const result = await voteRpc({ data: { warId, side } });
      if (result.success) {
        toast.success(`Voted for ${side}!`);
        queryClient.invalidateQueries({ queryKey: ["agent-wars-active"] });
      } else {
        toast.error(result.error ?? "Vote failed");
      }
    } catch {
      toast.error("Vote failed");
    } finally {
      setVotingWarId(null);
    }
  };

  const handleResolve = async (warId: string) => {
    try {
      const result = await resolveRpc({ data: { warId } });
      if (result.result) {
        toast.success(`${result.result.winner} wins the war!`);
        queryClient.invalidateQueries({ queryKey: ["agent-wars-active"] });
        queryClient.invalidateQueries({ queryKey: ["agent-wars"] });
      }
    } catch {
      toast.error("Failed to resolve war");
    }
  };

  if (wars.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Swords className="w-4 h-4 text-signal" />
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Agent Wars — Active Battles
        </h3>
      </div>

      <AnimatePresence mode="popLayout">
        {activeWars.map((war) => {
          const c = AGENT_CONFIG[war.challenger] ?? AGENT_CONFIG.RUSH;
          const d = AGENT_CONFIG[war.defender] ?? AGENT_CONFIG.ORACLE;
          const totalVotes = war.community_rush_votes + war.community_oracle_votes + war.community_myth_votes;

          return (
            <motion.div
              key={war.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="rounded-xl border border-signal/20 bg-signal/5 p-3 space-y-2"
            >
              {/* VS header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-black ${c.color}`}>
                    {c.emoji} {war.challenger}
                  </span>
                  <span className="text-xs text-muted-foreground/50 font-bold">VS</span>
                  <span className={`text-sm font-black ${d.color}`}>
                    {d.emoji} {war.defender}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  Entry: ${war.entry_price.toFixed(2)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 text-[10px] font-mono">
                <span className={c.color}>
                  {war.challenger}: {war.challenger_action} ×{war.challenger_amount.toFixed(1)}
                </span>
                <span className={d.color}>
                  {war.defender}: {war.defender_action} ×{war.defender_amount.toFixed(1)}
                </span>
              </div>

              {/* Vote buttons */}
              <div className="flex gap-2">
                {[war.challenger, war.defender].map((agent) => {
                  const cfg = AGENT_CONFIG[agent] ?? AGENT_CONFIG.RUSH;
                  const voteKey = `community_${agent.toLowerCase()}_votes` as keyof typeof war;
                  const votes = (war[voteKey] as number) ?? 0;
                  const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 50;
                  return (
                    <button
                      key={agent}
                      onClick={() => handleVote(war.id, agent as "RUSH" | "ORACLE" | "MYTH")}
                      disabled={votingWarId === war.id}
                      className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-border/20 ${cfg.bg} ${cfg.color} text-[10px] font-bold transition-all hover:brightness-110 disabled:opacity-50`}
                    >
                      {cfg.emoji} {agent} ({pct}%)
                    </button>
                  );
                })}
              </div>

              {/* Resolve button */}
              <button
                onClick={() => handleResolve(war.id)}
                className="w-full flex items-center justify-center gap-1.5 text-[10px] font-bold text-signal/70 hover:text-signal transition-colors py-1"
              >
                <CheckCircle className="w-3 h-3" />
                RESOLVE WAR
              </button>
            </motion.div>
          );
        })}

        {/* Recent resolved */}
        {recentResolved.map((war) => {
          const winCfg = AGENT_CONFIG[war.winner ?? "RUSH"] ?? AGENT_CONFIG.RUSH;
          return (
            <motion.div
              key={war.id}
              layout
              className="rounded-xl border border-border/10 bg-surface-elevated/20 p-2.5 opacity-60"
            >
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className={`font-bold ${winCfg.color}`}>
                  {winCfg.emoji} {war.winner} WON
                </span>
                <span className="text-muted-foreground">
                  vs {war.winner === war.challenger ? war.defender : war.challenger}
                </span>
                <span className="text-muted-foreground ml-auto">
                  ${war.entry_price.toFixed(2)} → ${(war.resolved_price ?? 0).toFixed(2)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
