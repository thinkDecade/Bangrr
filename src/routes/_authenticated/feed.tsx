import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PostCard, type PostData } from "@/components/feed/PostCard";
import { CreatePost } from "@/components/feed/CreatePost";
import { ActivitySidebar } from "@/components/feed/ActivitySidebar";
import { getPosts, getPriceHistory } from "@/lib/feed-functions";
import { runAgentCycle } from "@/lib/agent-engine";
import { useState, useMemo } from "react";
import { ArrowLeft, Activity, Bot, User } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/feed")({
  head: () => ({
    meta: [
      { title: "Feed — BANGRR" },
      {
        name: "description",
        content: "Trade attention on live opinions. APE or EXIT.",
      },
    ],
  }),
  component: FeedPage,
});

function FeedPage() {
  const queryClient = useQueryClient();
  const [showSidebar, setShowSidebar] = useState(false);
  const [agentsRunning, setAgentsRunning] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["feed-posts"],
    queryFn: () => getPosts({ data: { limit: 30 } }),
  });

  const posts = (data?.posts ?? []) as PostData[];
  const postIds = useMemo(() => posts.map((p) => p.id), [posts]);

  // Fetch real price history for all visible posts
  const { data: priceData } = useQuery({
    queryKey: ["price-history", postIds],
    queryFn: () => getPriceHistory({ data: { postIds, limit: 20 } }),
    enabled: postIds.length > 0,
  });

  const priceHistory = (priceData?.priceHistory ?? {}) as Record<string, number[]>;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
    queryClient.invalidateQueries({ queryKey: ["price-history"] });
  };

  const handleRunAgents = async () => {
    setAgentsRunning(true);
    try {
      const result = await runAgentCycle({ data: { maxPosts: 5 } });
      if (result.error) {
        toast.error(`Agent error: ${result.error}`);
      } else {
        const count = result.results.length;
        toast.success(`⚡👁🌀 ${count} agent trades executed`);
        handleRefresh();
      }
    } catch (e) {
      toast.error("Failed to run agents");
    } finally {
      setAgentsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-40 glass-card border-b border-border/20 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold">Feed</h1>
            <span className="inline-flex items-center gap-1 text-xs text-volt bg-volt/10 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-volt animate-pulse-glow" />
              LIVE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunAgents}
              disabled={agentsRunning}
              className="flex items-center gap-1.5 text-xs font-bold text-hyper bg-hyper/10 hover:bg-hyper/20 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
            >
              <Bot className={`w-3.5 h-3.5 ${agentsRunning ? "animate-spin" : ""}`} />
              {agentsRunning ? "RUNNING…" : "RUN AGENTS"}
            </button>
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
            >
              <Activity className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex gap-4">
          {/* Feed column */}
          <div className="flex-1 min-w-0 space-y-3">
            {isLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="glass-card rounded-2xl p-5 h-48 animate-shimmer bg-gradient-to-r from-surface via-surface-elevated to-surface"
                  />
                ))}
              </div>
            )}

            {!isLoading && posts.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 space-y-3"
              >
                <p className="text-2xl">🔥</p>
                <p className="text-muted-foreground text-sm">
                  No opinions yet. Be first to drop one.
                </p>
              </motion.div>
            )}

            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                priceHistory={priceHistory[post.id]}
                onTradeComplete={handleRefresh}
              />
            ))}
          </div>

          {/* Activity sidebar — desktop */}
          <div className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-20">
              <ActivitySidebar />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowSidebar(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-80 p-4">
            <ActivitySidebar />
          </div>
        </div>
      )}

      {/* Create post FAB */}
      <CreatePost onPostCreated={handleRefresh} />
    </div>
  );
}
