import { motion } from "framer-motion";
import { Sparkline } from "./Sparkline";
import { TradeActions } from "./TradeActions";
import { formatDistanceToNow } from "date-fns";

interface PostProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export interface PostData {
  id: string;
  content: string;
  current_price: number | null;
  price_change_pct: number | null;
  volume: number | null;
  created_at: string;
  creator_id: string;
  profiles: PostProfile | null;
}

interface PostCardProps {
  post: PostData;
  onTradeComplete?: () => void;
}

export function PostCard({ post, onTradeComplete }: PostCardProps) {
  const price = post.current_price ?? 1;
  const changePct = post.price_change_pct ?? 0;
  const volume = post.volume ?? 0;
  const isUp = changePct >= 0;
  const profile = post.profiles;
  const displayName = profile?.display_name || profile?.username || "anon";
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  // Mock sparkline data (will use real price_history later)
  const sparkData = Array.from({ length: 20 }, (_, i) => {
    const base = price * 0.9;
    const range = price * 0.2;
    return base + Math.sin(i * 0.8 + price) * range * 0.5 + Math.random() * range * 0.3;
  });
  sparkData.push(price);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-4 sm:p-5 space-y-3"
    >
      {/* Header: avatar + name + time */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0">
          {displayName[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate">{displayName}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
        </div>
        {/* Price pill */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tabular-nums">${price.toFixed(2)}</span>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              isUp
                ? "bg-volt/15 text-volt"
                : "bg-signal/15 text-signal"
            }`}
          >
            {isUp ? "+" : ""}
            {changePct.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Content */}
      <p className="text-base leading-relaxed">{post.content}</p>

      {/* Sparkline + stats */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-8">
          <Sparkline
            data={sparkData}
            color={isUp ? "var(--volt)" : "var(--signal)"}
          />
        </div>
        <div className="text-xs text-muted-foreground tabular-nums">
          Vol: {volume.toLocaleString()}
        </div>
      </div>

      {/* Trade actions */}
      <TradeActions postId={post.id} onTradeComplete={onTradeComplete} />
    </motion.div>
  );
}
