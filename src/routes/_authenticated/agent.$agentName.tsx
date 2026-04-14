import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getAgentProfile } from "@/lib/agent-stats-functions";
import { getAgentMemory } from "@/lib/unibase-memory";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, TrendingDown, Zap, Target, BarChart3, Clock, Flame, Shield, Brain } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";

const VALID_AGENTS = ["RUSH", "ORACLE", "MYTH"] as const;
type AgentName = (typeof VALID_AGENTS)[number];

const agentColors: Record<string, string> = {
  RUSH: "oklch(0.85 0.25 155)",   // volt
  ORACLE: "oklch(0.65 0.2 280)",  // hyper
  MYTH: "oklch(0.75 0.15 220)",   // cyan
};

const agentAccentClass: Record<string, string> = {
  RUSH: "text-volt",
  ORACLE: "text-hyper",
  MYTH: "text-cyan",
};

const agentBgClass: Record<string, string> = {
  RUSH: "bg-volt/10 border-volt/20",
  ORACLE: "bg-hyper/10 border-hyper/20",
  MYTH: "bg-cyan/10 border-cyan/20",
};

export const Route = createFileRoute("/_authenticated/agent/$agentName")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.agentName} Agent — BANGRR` },
      { name: "description", content: `Trading profile and performance for ${params.agentName} AI agent` },
    ],
  }),
  component: AgentProfilePage,
});

function AgentProfilePage() {
  const { agentName } = Route.useParams();

  const normalizedName = agentName.toUpperCase() as AgentName;
  const isValid = VALID_AGENTS.includes(normalizedName);

  const { data, isLoading } = useQuery({
    queryKey: ["agent-profile", normalizedName],
    queryFn: () => getAgentProfile({ data: { agentName: normalizedName } }),
    enabled: isValid,
  });

  const { data: memoryData } = useQuery({
    queryKey: ["agent-memory", normalizedName],
    queryFn: () => getAgentMemory({ data: { agentName: normalizedName } }),
    enabled: isValid,
  });

  if (!isValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-4xl">🚫</p>
          <p className="text-muted-foreground font-mono">Agent not found.</p>
          <Link to="/feed" className="text-primary font-mono text-sm hover:underline">← back to feed</Link>
        </div>
      </div>
    );
  }

  const profile = data?.profile;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-border/20 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link to="/feed" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold">Agent Profile</h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-surface animate-pulse" />
            ))}
          </div>
        )}

        {profile && (
          <>
            {/* Agent Identity Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border p-6 ${agentBgClass[normalizedName]}`}
            >
              <div className="flex items-start gap-4">
                <div className="text-5xl">{profile.emoji}</div>
                <div className="flex-1">
                  <h2 className={`text-3xl font-black tracking-tighter ${agentAccentClass[normalizedName]}`}>
                    {profile.name}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 font-mono max-w-xl">
                    {profile.description}
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className={`text-2xl font-black font-mono ${profile.stats.totalPnl >= 0 ? "text-volt" : "text-signal"}`}>
                      {profile.stats.totalPnl >= 0 ? "+" : ""}{profile.stats.totalPnl.toFixed(1)}% P&L
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {profile.stats.totalTrades} trades
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3"
            >
              <StatCard icon={<Target className="w-4 h-4 text-cyan" />} label="WIN RATE" value={`${profile.stats.winRate}%`} />
              <StatCard icon={<BarChart3 className="w-4 h-4 text-alert" />} label="VOLUME" value={profile.stats.totalVolume.toFixed(0)} />
              <StatCard icon={<Zap className="w-4 h-4 text-volt" />} label="APE / EXIT" value={`${profile.stats.apeCount} / ${profile.stats.exitCount}`} />
              <StatCard icon={<Clock className="w-4 h-4 text-hyper" />} label="AVG SIZE" value={profile.stats.avgTradeSize.toFixed(1)} />
              <StatCard
                icon={<TrendingUp className="w-4 h-4 text-volt" />}
                label="BEST TRADE"
                value={`+${profile.stats.biggestWin.toFixed(1)}%`}
                valueClass="text-volt"
              />
              <StatCard
                icon={<TrendingDown className="w-4 h-4 text-signal" />}
                label="WORST TRADE"
                value={`${profile.stats.biggestLoss.toFixed(1)}%`}
                valueClass="text-signal"
              />
              <StatCard icon={<Flame className="w-4 h-4 text-amber-400" />} label="TOTAL TRADES" value={String(profile.stats.totalTrades)} />
              <StatCard icon={<Shield className="w-4 h-4 text-cyan" />} label="P&L" value={`${profile.stats.totalPnl >= 0 ? "+" : ""}${profile.stats.totalPnl.toFixed(1)}%`} valueClass={profile.stats.totalPnl >= 0 ? "text-volt" : "text-signal"} />
            </motion.div>

            {/* P&L Chart + Strategy */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* P&L Over Time */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2 glass-card rounded-2xl p-4"
              >
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Cumulative P&L
                </h3>
                {profile.pnlOverTime.length > 1 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={profile.pnlOverTime}>
                      <defs>
                        <linearGradient id={`pnl-${normalizedName}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={agentColors[normalizedName]} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={agentColors[normalizedName]} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" tick={{ fontSize: 10, fill: "oklch(0.5 0 0)" }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "oklch(0.5 0 0)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                      <Tooltip
                        contentStyle={{ background: "oklch(0.13 0.015 270)", border: "1px solid oklch(0.22 0.02 270)", borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: "oklch(0.6 0 0)" }}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, "P&L"]}
                      />
                      <Area type="monotone" dataKey="pnl" stroke={agentColors[normalizedName]} fill={`url(#pnl-${normalizedName})`} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm font-mono">
                    Not enough data yet
                  </div>
                )}
              </motion.div>

              {/* Strategy Breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card rounded-2xl p-4"
              >
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Strategy
                </h3>
                <div className="space-y-3">
                  {profile.strategies.map((s, i) => (
                    <div key={i} className="space-y-1">
                      <div className={`text-xs font-bold ${agentAccentClass[normalizedName]}`}>
                        {s.name}
                      </div>
                      <p className="text-[11px] text-muted-foreground font-mono leading-relaxed">
                        {s.detail}
                      </p>
                    </div>
                  ))}
                </div>

                {/* APE vs EXIT pie */}
                {profile.stats.totalTrades > 0 && (
                  <div className="mt-4">
                    <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Action Split</h4>
                    <ResponsiveContainer width="100%" height={100}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: "APE", value: profile.stats.apeCount },
                            { name: "EXIT", value: profile.stats.exitCount },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={25}
                          outerRadius={40}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          <Cell fill="oklch(0.85 0.25 155)" />
                          <Cell fill="oklch(0.65 0.28 25)" />
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: "oklch(0.13 0.015 270)", border: "1px solid oklch(0.22 0.02 270)", borderRadius: 8, fontSize: 11 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 text-[10px] font-mono">
                      <span className="text-volt">● APE ({profile.stats.apeCount})</span>
                      <span className="text-signal">● EXIT ({profile.stats.exitCount})</span>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Recent Trades Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card rounded-2xl p-4"
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Recent Trades
              </h3>
              {profile.recentTrades.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6 font-mono">
                  No trades recorded yet. Run agents to start the action.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="text-muted-foreground text-left border-b border-border/20">
                        <th className="pb-2 pr-4">ACTION</th>
                        <th className="pb-2 pr-4">AMOUNT</th>
                        <th className="pb-2 pr-4">PRICE</th>
                        <th className="pb-2 pr-4">IMPACT</th>
                        <th className="pb-2">TIME</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.recentTrades.map((trade) => (
                        <tr key={trade.id} className="border-b border-border/10 hover:bg-surface/50 transition-colors">
                          <td className="py-2 pr-4">
                            <span className={`font-bold ${trade.action === "APE" ? "text-volt" : "text-signal"}`}>
                              {trade.action === "APE" ? "🟢" : "🔴"} {trade.action}
                            </span>
                          </td>
                          <td className="py-2 pr-4 text-foreground">{trade.amount.toFixed(1)}</td>
                          <td className="py-2 pr-4 text-muted-foreground">
                            ${trade.oldPrice.toFixed(2)} → ${trade.newPrice.toFixed(2)}
                          </td>
                          <td className="py-2 pr-4">
                            <span className={trade.pnlPct >= 0 ? "text-volt" : "text-signal"}>
                              {trade.pnlPct >= 0 ? "+" : ""}{trade.pnlPct.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-2 text-muted-foreground">
                            {new Date(trade.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

            {/* Navigation to other agents */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-3"
            >
              {VALID_AGENTS.filter((a) => a !== normalizedName).map((a) => (
                <Link
                  key={a}
                  to="/agent/$agentName"
                  params={{ agentName: a }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors hover:bg-surface ${agentBgClass[a]}`}
                >
                  <span>{{ RUSH: "⚡", ORACLE: "👁", MYTH: "🌀" }[a]}</span>
                  <span className="text-sm font-bold">{a}</span>
                </Link>
              ))}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, valueClass }: { icon: React.ReactNode; label: string; value: string; valueClass?: string }) {
  return (
    <div className="glass-card rounded-xl p-3 flex flex-col items-center gap-1">
      {icon}
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-bold font-mono ${valueClass ?? "text-foreground"}`}>{value}</span>
    </div>
  );
}
