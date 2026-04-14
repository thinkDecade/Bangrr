import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { executeTrade, executeRotation } from "@/lib/feed-functions";
import { executeGaslessTrade } from "@/lib/pieverse-functions";
import { openLeveragedPosition } from "@/lib/leverage-functions";
import { generateNonce } from "@/lib/pieverse-contract";
import { TrendingUp, TrendingDown, RefreshCw, Zap, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TradeActionsProps {
  postId: string;
  currentPrice?: number;
  onTradeComplete?: () => void;
  otherPosts?: Array<{ id: string; content: string; current_price: number | null }>;
}

const AMOUNTS = [0.1, 0.5, 1, 5, 10];
const LEVERAGES = [1, 2, 5, 10] as const;

function estimateImpact(price: number, amount: number, direction: 1 | -1, leverage: number): number {
  const effectiveAmount = leverage > 1 ? amount * leverage * 0.3 : amount;
  const newPrice = price * (1 + direction * 0.05 * Math.sqrt(effectiveAmount));
  return Math.max(0.01, newPrice);
}

function liqPrice(entry: number, leverage: number, direction: 1 | -1): number {
  if (leverage <= 1) return 0;
  return Math.max(0.01, entry * (1 - direction * (1 / leverage)));
}

export function TradeActions({ postId, currentPrice = 1, onTradeComplete, otherPosts }: TradeActionsProps) {
  const [loading, setLoading] = useState<"APE" | "EXIT" | "ROTATE" | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState(1);
  const [showAmounts, setShowAmounts] = useState(false);
  const [showRotate, setShowRotate] = useState(false);
  const [gasless, setGasless] = useState(false);
  const [leverage, setLeverage] = useState<number>(1);
  const [showLeverage, setShowLeverage] = useState(false);

  const executeTradeRpc = useServerFn(executeTrade);
  const executeRotationRpc = useServerFn(executeRotation);
  const executeGaslessRpc = useServerFn(executeGaslessTrade);
  const openLeverageRpc = useServerFn(openLeveragedPosition);

  const apeEstimate = estimateImpact(currentPrice, selectedAmount, 1, leverage);
  const exitEstimate = estimateImpact(currentPrice, selectedAmount, -1, leverage);
  const apePct = ((apeEstimate - currentPrice) / currentPrice * 100).toFixed(1);
  const exitPct = ((exitEstimate - currentPrice) / currentPrice * 100).toFixed(1);

  const apeLiq = liqPrice(currentPrice, leverage, 1);
  const exitLiq = liqPrice(currentPrice, leverage, -1);

  const handleTrade = async (action: "APE" | "EXIT") => {
    setLoading(action);
    try {
      let success = false;

      if (leverage > 1) {
        const result = await openLeverageRpc({
          data: { postId, action, amount: selectedAmount, leverage },
        });
        success = result.success;
      } else if (gasless) {
        const nonce = generateNonce();
        const result = await executeGaslessRpc({
          data: {
            postId,
            action,
            amount: selectedAmount,
            gaslessSignature: "0x" + "00".repeat(65),
            from: "0x" + "00".repeat(20),
            nonce,
          },
        });
        success = result.success;
      } else {
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
  const isLeveraged = leverage > 1;

  return (
    <div className="space-y-2 pt-1">
      {/* Amount selector + gasless toggle + leverage toggle */}
      <div className="flex items-center gap-2 flex-wrap">
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

        {/* Leverage toggle */}
        <button
          onClick={() => setShowLeverage(!showLeverage)}
          className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
            isLeveraged
              ? "bg-hyper/15 text-hyper border-hyper/30"
              : "bg-surface-elevated/30 text-muted-foreground/60 border-border/20 hover:text-muted-foreground"
          }`}
          title="Toggle leverage via MYX Finance"
        >
          <Target className={`w-3 h-3 ${isLeveraged ? "text-hyper" : ""}`} />
          {isLeveraged ? `${leverage}×` : "1×"}
        </button>

        <AnimatePresence>
          {showLeverage && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-1 overflow-hidden"
            >
              {LEVERAGES.map((lev) => (
                <button
                  key={lev}
                  onClick={() => {
                    setLeverage(lev);
                    setShowLeverage(false);
                  }}
                  className={`text-xs font-mono px-2 py-1 rounded-md transition-all ${
                    lev === leverage
                      ? "bg-hyper text-background"
                      : "bg-surface-elevated/30 text-muted-foreground hover:text-foreground hover:bg-surface-elevated/60"
                  }`}
                >
                  {lev}×
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gasless toggle (hidden when leveraged) */}
        {!isLeveraged && (
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
        )}

        {!showAmounts && !showLeverage && (
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
              : isLeveraged
                ? "bg-hyper/15 text-hyper hover:bg-hyper/25 border border-hyper/20"
                : "bg-volt/15 text-volt hover:bg-volt/25 border border-volt/20"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          {loading === "APE" ? "..." : `APE ×${selectedAmount}`}
          {isLeveraged && <span className="text-[10px] opacity-70">{leverage}×</span>}
          {gasless && !isLeveraged && <Zap className="w-3 h-3 fill-current" />}
        </Button>
        <Button
          size="sm"
          onClick={() => handleTrade("EXIT")}
          disabled={loading !== null}
          className={`flex-1 rounded-xl font-bold text-sm gap-1.5 transition-all ${
            lastAction === "EXIT"
              ? "animate-collapse bg-signal text-background"
              : isLeveraged
                ? "bg-hyper/15 text-hyper hover:bg-hyper/25 border border-hyper/20"
                : "bg-signal/15 text-signal hover:bg-signal/25 border border-signal/20"
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          {loading === "EXIT" ? "..." : `EXIT ×${selectedAmount}`}
          {isLeveraged && <span className="text-[10px] opacity-70">{leverage}×</span>}
          {gasless && !isLeveraged && <Zap className="w-3 h-3 fill-current" />}
        </Button>
        {rotateTargets.length > 0 && !isLeveraged && (
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

      {/* Leverage info banner */}
      <AnimatePresence>
        {isLeveraged && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-hyper/20 bg-hyper/5 px-3 py-1.5 space-y-1">
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-hyper shrink-0" />
                <p className="text-[10px] text-hyper/80">
                  <span className="font-bold">MYX Finance</span> — {leverage}× leveraged position
                </p>
              </div>
              <div className="flex gap-4 text-[10px] font-mono">
                <span className="text-volt/70">APE liq: ${apeLiq.toFixed(2)}</span>
                <span className="text-signal/70">EXIT liq: ${exitLiq.toFixed(2)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gasless info banner */}
      <AnimatePresence>
        {gasless && !isLeveraged && (
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
