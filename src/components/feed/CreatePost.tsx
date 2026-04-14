import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useServerFn } from "@tanstack/react-start";
import { createPost } from "@/lib/feed-functions";
import { Plus } from "lucide-react";

interface CreatePostProps {
  onPostCreated?: () => void;
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createPostRpc = useServerFn(createPost);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await createPostRpc({ data: { content: content.trim() } });
      if (result.error) {
        setError(result.error);
      } else {
        setContent("");
        setOpen(false);
        onPostCreated?.();
      }
    } catch (err) {
      setError("Failed to drop opinion. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const remaining = 280 - content.length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-volt text-background flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform">
          <Plus className="w-7 h-7" strokeWidth={2.5} />
        </button>
      </DialogTrigger>
      <DialogContent className="glass-card border-border/30 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Drop an Opinion</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 280))}
              placeholder="What's your market take?"
              rows={4}
              className="w-full bg-surface rounded-xl p-3 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-volt/40 border border-border/30"
            />
            <span
              className={`absolute bottom-3 right-3 text-xs tabular-nums ${
                remaining < 20 ? "text-signal" : "text-muted-foreground"
              }`}
            >
              {remaining}
            </span>
          </div>
          {error && (
            <p className="text-xs text-signal">{error}</p>
          )}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Starts at <span className="text-volt font-semibold">$1.00</span>
            </p>
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || loading}
              className="rounded-xl bg-volt text-background font-bold hover:bg-volt/90"
            >
              {loading ? "Dropping..." : "Drop It 🔥"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
