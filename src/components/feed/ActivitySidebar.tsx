import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ClipsFeed } from "./ClipsFeed";
import { AgentWarsLeaderboard } from "./AgentWarsLeaderboard";
import { formatDistanceToNow } from "date-fns";
import type { Json } from "@/integrations/supabase/types";

interface ActivityEntry {
  id: string;
  actor_type: string;
  actor_name: string;
  action: string;
  post_id: string | null;
  metadata: Json | null;
  created_at: string;
}

export function ActivitySidebar() {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    // Initial fetch
    supabase
      .from("activity_feed")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        if (data) setActivities(data);
      });

    // Realtime subscription
    const channel = supabase
      .channel("activity-feed-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_feed" },
        (payload) => {
          setActivities((prev) => [payload.new as ActivityEntry, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getActionColor = (action: string) => {
    switch (action) {
      case "APE":
        return "text-volt";
      case "EXIT":
        return "text-signal";
      case "DROPPED":
        return "text-cyan";
      case "ROTATE":
        return "text-cyan";
      default:
        return "text-muted-foreground";
    }
  };

  const getActionEmoji = (action: string, actorType: string, actorName: string) => {
    if (actorType === "agent") {
      switch (actorName) {
        case "RUSH": return "⚡";
        case "ORACLE": return "👁";
        case "MYTH": return "🌀";
      }
    }
    switch (action) {
      case "APE":
        return "🟢";
      case "EXIT":
        return "🔴";
      case "DROPPED":
        return "🔥";
      case "ROTATE":
        return "🔄";
      default:
        return "·";
    }
  };

  const getActorDisplay = (entry: ActivityEntry) => {
    if (entry.actor_type === "agent") {
      return (
        <span className="font-bold text-hyper">
          {entry.actor_name}
        </span>
      );
    }
    return (
      <span className="text-muted-foreground">
        {entry.actor_name.slice(0, 8)}…
      </span>
    );
  };

  return (
    <div className="glass-card rounded-2xl p-4 h-full max-h-[calc(100vh-8rem)] flex flex-col">
      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
        Live Activity
      </h3>
      <div className="mb-4">
        <ClipsFeed />
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin">
        {activities.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">
            No activity yet. Be first.
          </p>
        )}
        {activities.map((entry) => (
          <div
            key={entry.id}
            className="flex items-start gap-2 py-1.5 text-xs animate-float-up"
          >
            <span>{getActionEmoji(entry.action, entry.actor_type, entry.actor_name)}</span>
            <div className="flex-1 min-w-0">
              {getActorDisplay(entry)}{" "}
              <span className={`font-semibold ${getActionColor(entry.action)}`}>
                {entry.action}
              </span>
              {entry.metadata &&
                typeof entry.metadata === "object" &&
                !Array.isArray(entry.metadata) &&
                "amount" in entry.metadata && (
                  <span className="text-muted-foreground">
                    {" "}
                    ×{String(entry.metadata.amount)}
                  </span>
                )}
            </div>
            <span className="text-muted-foreground/50 shrink-0">
              {formatDistanceToNow(new Date(entry.created_at), { addSuffix: false })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
