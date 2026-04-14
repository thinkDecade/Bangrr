import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import type { Json } from "@/integrations/supabase/types";

interface Clip {
  id: string;
  post_id: string;
  clip_type: string;
  trigger_event: Json | null;
  created_at: string;
}

const CLIP_CONFIG: Record<string, { emoji: string; label: string; color: string; bgColor: string }> = {
  APE_MOMENT: { emoji: "🦍", label: "APE MOMENT", color: "text-volt", bgColor: "bg-volt/10 border-volt/30" },
  ORACLE_CALL: { emoji: "👁", label: "ORACLE CALL", color: "text-hyper", bgColor: "bg-hyper/10 border-hyper/30" },
  VOLATILITY_SPIKE: { emoji: "📈", label: "VOLATILITY SPIKE", color: "text-alert", bgColor: "bg-alert/10 border-alert/30" },
};

export function ClipsFeed() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [newClipId, setNewClipId] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch
    supabase
      .from("clips")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setClips(data);
      });

    // Realtime subscription
    const channel = supabase
      .channel("clips-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "clips" },
        (payload) => {
          const newClip = payload.new as Clip;
          setClips((prev) => [newClip, ...prev].slice(0, 30));
          setNewClipId(newClip.id);
          setTimeout(() => setNewClipId(null), 3000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (clips.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <span>🎬</span> Clips
      </h3>
      <AnimatePresence mode="popLayout">
        {clips.slice(0, 8).map((clip) => {
          const config = CLIP_CONFIG[clip.clip_type] ?? {
            emoji: "📎",
            label: clip.clip_type,
            color: "text-muted-foreground",
            bgColor: "bg-muted/10 border-muted/30",
          };
          const event = clip.trigger_event as Record<string, unknown> | null;
          const isNew = clip.id === newClipId;

          return (
            <motion.div
              key={clip.id}
              layout
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                boxShadow: isNew ? "0 0 20px rgba(139, 92, 255, 0.3)" : "none",
              }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`rounded-xl border p-3 ${config.bgColor} ${isNew ? "ring-1 ring-hyper/50" : ""}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">{config.emoji}</span>
                <span className={`text-xs font-black tracking-wide ${config.color}`}>
                  {config.label}
                </span>
                <span className="text-[10px] text-muted-foreground/50 ml-auto">
                  {formatDistanceToNow(new Date(clip.created_at), { addSuffix: false })}
                </span>
              </div>
              {event && (
                <div className="text-[11px] text-muted-foreground space-x-2">
                  {event.actor_name && (
                    <span>
                      by{" "}
                      <span className={event.actor_type === "agent" ? "text-hyper font-bold" : ""}>
                        {event.actor_type === "agent"
                          ? String(event.actor_name)
                          : `${String(event.actor_name).slice(0, 6)}…`}
                      </span>
                      <span className={event.actor_type === "agent" ? "text-hyper font-bold" : ""}>
                        {event.actor_type === "agent"
                          ? String(event.actor_name)
                          : `${String(event.actor_name).slice(0, 6)}…`}
                      </span>
                    </span>
                  )}
                  {event.amount && <span>×{String(event.amount)}</span>}
                  {event.price_change_pct != null && (
                    <span className={Number(event.price_change_pct) >= 0 ? "text-volt" : "text-signal"}>
                      {Number(event.price_change_pct) >= 0 ? "+" : ""}
                      {Number(event.price_change_pct).toFixed(1)}%
                    </span>
                  )}
                  {event.volatility_pct != null && (
                    <span className="text-alert">
                      {Number(event.volatility_pct).toFixed(1)}% vol
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
