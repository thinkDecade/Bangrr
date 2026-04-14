import { useQuery } from "@tanstack/react-query";
import { getUserLeveragedPositions } from "@/lib/leverage-functions";
import { motion, AnimatePresence } from "framer-motion";
import { Target, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

interface PositionPanelProps {
  currentPrices?: Record<string, number>;
}

export function PositionPanel({ currentPrices = {} }: PositionPanelProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["leveraged-positions"],
    queryFn: () => getUserLeveragedPositions({ data: { openOnly: true } }),
    refetchInterval: 10000,
  });

  const positions = (data?.positions ?? []) as Array<{
    id: string;
    post_id: string;
    action: string;
    amount: number;
    leverage: number;
    entry_price: number;
    liquidation_price: number;
    is_open: boolean;
    pnl: number;
    created_at: string;
  }>;

  if (isLoading || positions.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-hyper" />
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Leveraged Positions
        </h3>
        <span className="text-[10px] font-mono text-hyper ml-auto">
          {positions.length} OPEN
        </span>
      </div>

      <AnimatePresence mode="popLayout">
        {positions.map((pos) => {
          const currentPrice = currentPrices[pos.post_id] ?? pos.entry_price;
          const direction = pos.action === "APE" ? 1 : -1;
          const pnlPct = ((currentPrice - pos.entry_price) / pos.entry_price) * 100 * direction * pos.leverage;
          const pnlValue = pos.amount * (pnlPct / 100);
          const isProfit = pnlPct >= 0;

          // Distance to liquidation
          const liqDistance = Math.abs(currentPrice - pos.liquidation_price) / currentPrice * 100;
          const isNearLiq = liqDistance < 15;

          return (
            <motion.div
              key={pos.id}
              layout
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`rounded-xl border p-3 space-y-2 ${
                isNearLiq
                  ? "border-signal/30 bg-signal/5"
                  : "border-hyper/20 bg-hyper/5"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {pos.action === "APE" ? (
                    <TrendingUp className="w-3.5 h-3.5 text-volt" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-signal" />
                  )}
                  <span className="text-xs font-bold">
                    {pos.action} ×{pos.amount}
                  </span>
                  <span className="text-[10px] font-mono text-hyper px-1.5 py-0.5 rounded bg-hyper/10">
                    {pos.leverage}×
                  </span>
                </div>
                <span className={`text-sm font-bold font-mono ${isProfit ? "text-volt" : "text-signal"}`}>
                  {isProfit ? "+" : ""}{pnlPct.toFixed(1)}%
                </span>
              </div>

              {/* Details */}
              <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                <div>
                  <span className="text-muted-foreground/60">Entry</span>
                  <div className="text-foreground">${pos.entry_price.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground/60">Current</span>
                  <div className="text-foreground">${currentPrice.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground/60">P&L</span>
                  <div className={isProfit ? "text-volt" : "text-signal"}>
                    {isProfit ? "+" : ""}{pnlValue.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Liquidation warning */}
              <div className={`flex items-center gap-1.5 text-[10px] font-mono ${isNearLiq ? "text-signal" : "text-muted-foreground/50"}`}>
                {isNearLiq && <AlertTriangle className="w-3 h-3 animate-pulse" />}
                <span>Liq: ${pos.liquidation_price.toFixed(2)}</span>
                <span className="ml-auto">{liqDistance.toFixed(0)}% away</span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
