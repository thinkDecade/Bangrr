import { motion } from "framer-motion";
import { Award } from "lucide-react";

interface EarlyApeBadgeProps {
  tokenId: number;
  entryPrice: number;
  qualifyingPrice: number;
}

export function EarlyApeBadge({ tokenId, entryPrice, qualifyingPrice }: EarlyApeBadgeProps) {
  const multiplier = Math.round((qualifyingPrice / entryPrice) * 10) / 10;

  return (
    <motion.div
      initial={{ scale: 0, rotate: -20 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/30 text-amber-400"
    >
      <Award className="w-3.5 h-3.5" />
      <span className="text-[10px] font-black tracking-wide">
        EARLY APE #{tokenId}
      </span>
      <span className="text-[9px] font-mono text-amber-400/60">
        {multiplier}×
      </span>
    </motion.div>
  );
}
