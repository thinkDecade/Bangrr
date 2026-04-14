import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { executeTrade, executeRotation } from "@/lib/feed-functions";
import { executeGaslessTrade } from "@/lib/pieverse-functions";
import { generateNonce } from "@/lib/pieverse-contract";
import { TrendingUp, TrendingDown, RefreshCw, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TradeActionsProps {
  postId: string;
  currentPrice?: number;
  onTradeComplete?: () => void;
  otherPosts?: Array<{ id: string; content: string; current_price: number | null }>;
}

const AMOUNTS = [0.1, 0.5, 1, 5, 10];

function estimateImpact(price: number, amount: number, direction: 1 | -1): number {
  const newPrice = price * (1 + direction * 0.05 * Math.sqrt(amount));
  return Math.max(0.01, newPrice);
}

export function TradeActions({ postId, currentPrice = 1, onTradeComplete, otherPosts }: TradeActionsProps) {
  const [loading, setLoading] = useState<"APE" | "EXIT" | "ROTATE" | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState(1);
  const [showAmounts, setShowAmounts] = useState(false);
  const [showRotate, setShowRotate] = useState(false);
  const [gasless, setGasless] = useState(false);

  const executeTradeRpc = useServerFn(executeTrade);
  const executeRotationRpc = useServerFn(executeRotation);
  const executeGaslessRpc = useServerFn(executeGaslessTrade);

  const apeEstimate = estimateImpact(currentPrice, selectedAmount, 1);
  const exitEstimate = estimateImpact(currentPrice, selectedAmount, -1);
  const apePct = ((apeEstimate - currentPrice) / currentPrice * 100).toFixed(1);
  const exitPct = ((exitEstimate - currentPrice) / currentPrice * 100).toFixed(1);

  const handleTrade = async (action: "APE" | "EXIT") => {
    setLoading(action);
    try {
      let success = false;

      if (gasless) {
        // Gasless via Pieverse x402b
        const nonce = generateNonce();
        const result = await executeGaslessRpc({
          data: {
            postId,
            action,
            amount: selectedAmount,
            gaslessSignature: "0x" + "00".repeat(65), // Mock — real flow signs EIP-712
            from: "0x" + "00".repeat(20), // Mock — real flow uses connected wallet
            nonce,
          },
        });
        success = result.success;
      } else {
        // Standard trade
        const result = await executeTradeRpc({
          data: { postId, action, amount: selectedAmount },
        });
        success = result.success;
      }

      if (success) {
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

  const handleRotate = async (toPostId: string) => {
    setLoading("ROTATE");
    setShowRotate(false);
    try {
      const result = await executeRotationRpc({
        data: { fromPostId: postId, toPostId, amount: selectedAmount },
      });
      if (result.success) {
        setLastAction("ROTATE");
        setTimeout(() => setLastAction(null), 1500);
        onTradeComplete?.();
      }
    } catch (err) {
      console.error("Rotation failed:", err);
    } finally {
      setLoading(null);
    }
  };

  const rotateTargets = (otherPosts ?? []).filter((p) => p.id !== postId);

  return (
    <div className="space-y-2 pt-1">
      {/* Amount selector + gasless toggle */}
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

        {/* Gasless toggle */}
        <button
          onClick={() => setGasless(!gasless)}
          className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
            gasless
              ? "bg-alert/15 text-alert border-alert/30"
              : "bg-surface-elevated/30 text-muted-foreground/60 border-border/20 hover:text-muted-foreground"
          }`}
          title="Toggle gasless trading via Pieverse x402b"
        >
          <Zap className={`w-3 h-3 ${gasless ? "fill-alert" : ""}`} />
          {gasless ? "GASLESS" : "GAS"}
        </button>

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
          {gasless && <Zap className="w-3 h-3 fill-current" />}
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
          {gasless && <Zap className="w-3 h-3 fill-current" />}
        </Button>
        {rotateTargets.length > 0 && (
          <Button
            size="sm"
            onClick={() => setShowRotate(!showRotate)}
            disabled={loading !== null}
            className={`rounded-xl font-bold text-sm gap-1.5 transition-all px-3 ${
              lastAction === "ROTATE"
                ? "bg-cyan text-background"
                : "bg-cyan/15 text-cyan hover:bg-cyan/25 border border-cyan/20"
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${loading === "ROTATE" ? "animate-spin" : ""}`} />
            {loading === "ROTATE" ? "..." : "ROTATE"}
          </Button>
        )}
      </div>

      {/* Gasless info banner */}
      <AnimatePresence>
        {gasless && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-alert/20 bg-alert/5 px-3 py-1.5 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-alert fill-alert shrink-0" />
              <p className="text-[10px] text-alert/80">
                <span className="font-bold">Pieverse x402b</span> — gasless via pieUSD. No BNB needed for gas.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rotation target picker */}
      <AnimatePresence>
        {showRotate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-cyan/20 bg-cyan/5 p-3 space-y-2">
              <p className="text-xs font-bold text-cyan uppercase tracking-wider">
                Rotate ×{selectedAmount} into:
              </p>
              <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin">
                {rotateTargets.map((target) => (
                  <button
                    key={target.id}
                    onClick={() => handleRotate(target.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-surface-elevated/30 hover:bg-surface-elevated/60 transition-colors text-left"
                  >
                    <span className="text-sm truncate flex-1 mr-2">
                      {target.content.slice(0, 45)}{target.content.length > 45 ? "…" : ""}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground shrink-0">
                      ${(target.current_price ?? 1).toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
