import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TickerPost {
  id: string;
  content: string;
  current_price: number;
  price_change_pct: number;
}

export function PriceTicker() {
  const [posts, setPosts] = useState<TickerPost[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from("posts")
      .select("id, content, current_price, price_change_pct")
      .eq("is_active", true)
      .order("volume", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setPosts(data.map(mapPost));
      });

    const channel = supabase
      .channel("ticker-prices")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "posts" },
        (payload) => {
          const updated = payload.new as TickerPost;
          setPosts((prev) => {
            const idx = prev.findIndex((p) => p.id === updated.id);
            if (idx === -1) return prev;
            const next = [...prev];
            next[idx] = mapPost(updated as unknown as Record<string, unknown>);
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (posts.length === 0) return null;

  // Double the items for seamless scroll loop
  const items = [...posts, ...posts];

  return (
    <div className="w-full overflow-hidden border-b border-border/10 bg-background/80 backdrop-blur-sm">
      <div
        ref={scrollRef}
        className="flex animate-ticker whitespace-nowrap py-1.5"
      >
        {items.map((post, i) => {
          const isUp = (post.price_change_pct ?? 0) >= 0;
          return (
            <span
              key={`${post.id}-${i}`}
              className="inline-flex items-center gap-1.5 px-4 text-[11px] font-mono shrink-0"
            >
              <span className="text-muted-foreground truncate max-w-[120px]">
                {post.content.slice(0, 24)}
              </span>
              <span className="font-bold text-foreground">
                ${(post.current_price ?? 1).toFixed(2)}
              </span>
              <span
                className={`flex items-center gap-0.5 font-bold ${
                  isUp ? "text-volt" : "text-signal"
                }`}
              >
                {isUp ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {isUp ? "+" : ""}
                {(post.price_change_pct ?? 0).toFixed(1)}%
              </span>
              <span className="text-border mx-2">│</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function mapPost(p: Record<string, unknown>): TickerPost {
  return {
    id: p.id as string,
    content: (p.content as string) ?? "",
    current_price: (p.current_price as number) ?? 1,
    price_change_pct: (p.price_change_pct as number) ?? 0,
  };
}
