import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { executeTrade } from "@/lib/feed-functions";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TradeActionsProps {
  postId: string;
  onTradeComplete?: () => void;
}

export function TradeActions({ postId, onTradeComplete }: TradeActionsProps) {
  const [loading, setLoading] = useState<"APE" | "EXIT" | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const executeTradeRpc = useServerFn(executeTrade);

  const handleTrade = async (action: "APE" | "EXIT") => {
    setLoading(action);
    try {
      const result = await executeTradeRpc({
        data: { postId, action, amount: 1 },
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
    <div className="flex items-center gap-2 pt-1">
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
        {loading === "APE" ? "..." : "APE"}
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
        {loading === "EXIT" ? "..." : "EXIT"}
      </Button>
    </div>
  );
}
