import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { executeTrade } from "@/lib/feed-functions";
import { TrendingUp, TrendingDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TradeActionsProps {
  postId: string;
  currentPrice?: number;
  onTradeComplete?: () => void;
}

const AMOUNTS = [0.1, 0.5, 1, 5, 10];

function estimateImpact(price: number, amount: number, direction: 1 | -1): number {
  const newPrice = price * (1 + direction * 0.05 * Math.sqrt(amount));
  return Math.max(0.01, newPrice);
}

export function TradeActions({ postId, currentPrice = 1, onTradeComplete }: TradeActionsProps) {
  const [loading, setLoading] = useState<"APE" | "EXIT" | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState(1);
  const [showAmounts, setShowAmounts] = useState(false);
  const executeTradeRpc = useServerFn(executeTrade);

  const apeEstimate = estimateImpact(currentPrice, selectedAmount, 1);
  const exitEstimate = estimateImpact(currentPrice, selectedAmount, -1);
  const apePct = ((apeEstimate - currentPrice) / currentPrice * 100).toFixed(1);
  const exitPct = ((exitEstimate - currentPrice) / currentPrice * 100).toFixed(1);

  const handleTrade = async (action: "APE" | "EXIT") => {
    setLoading(action);
    try {
      const result = await executeTradeRpc({
        data: { postId, action, amount: selectedAmount },
      });
      if (result.success) {
        setLastAction(action);
        setTimeout(() => setLastAction(null), 1500);
        onTradeComplete?.();
      }
    } catch (err) {
      console.error("Trade failed:", err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-2 pt-1">
      {/* Amount selector */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowAmounts(!showAmounts)}
          className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg bg-surface-elevated/50 border border-border/30"
        >
          ×{selectedAmount}
        </button>

        <AnimatePresence>
          {showAmounts && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-1 overflow-hidden"
            >
              {AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    setSelectedAmount(amt);
                    setShowAmounts(false);
                  }}
                  className={`text-xs font-mono px-2 py-1 rounded-md transition-all ${
                    amt === selectedAmount
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface-elevated/30 text-muted-foreground hover:text-foreground hover:bg-surface-elevated/60"
                  }`}
                >
                  {amt}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {!showAmounts && (
          <span className="text-[10px] font-mono text-muted-foreground/60">
            impact: <span className="text-volt">+{apePct}%</span> / <span className="text-signal">{exitPct}%</span>
          </span>
        )}
      </div>

      {/* Trade buttons */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => handleTrade("APE")}
          disabled={loading !== null}
          className={`flex-1 rounded-xl font-bold text-sm gap-1.5 transition-all ${
            lastAction === "APE"
              ? "animate-shockwave bg-volt text-background"
              : "bg-volt/15 text-volt hover:bg-volt/25 border border-volt/20"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          {loading === "APE" ? "..." : `APE ×${selectedAmount}`}
        </Button>
        <Button
          size="sm"
          onClick={() => handleTrade("EXIT")}
          disabled={loading !== null}
          className={`flex-1 rounded-xl font-bold text-sm gap-1.5 transition-all ${
            lastAction === "EXIT"
              ? "animate-collapse bg-signal text-background"
              : "bg-signal/15 text-signal hover:bg-signal/25 border border-signal/20"
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          {loading === "EXIT" ? "..." : `EXIT ×${selectedAmount}`}
        </Button>
      </div>
    </div>
  );
}
