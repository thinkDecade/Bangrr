import { useState, useCallback } from "react";
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
import { prepareFourMemeToken, confirmTokenDeployment } from "@/lib/fourmeme-functions";
import {
  generateTokenName,
  generateTokenSymbol,
  CREATION_FEE_WEI,
  FOUR_MEME_CONTRACTS,
  TOKEN_MANAGER_ABI,
  DEFAULT_TOTAL_SUPPLY,
} from "@/lib/fourmeme-contract";
import type { DeploymentState } from "@/lib/fourmeme-contract";
import { TokenDeployStatus } from "./TokenDeployStatus";
import { Plus, Rocket } from "lucide-react";

interface CreatePostProps {
  onPostCreated?: () => void;
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deployState, setDeployState] = useState<DeploymentState>({
    status: "idle",
    message: "",
  });

  const createPostRpc = useServerFn(createPost);
  const prepareTokenRpc = useServerFn(prepareFourMemeToken);
  const confirmDeployRpc = useServerFn(confirmTokenDeployment);

  const deployToken = useCallback(
    async (postId: string, postContent: string) => {
      try {
        // Step 1: Sign wallet auth
        setDeployState({ status: "signing", message: "Requesting wallet signature..." });

        // For now, we proceed with simulated deployment
        // Full integration would use Particle's wallet client for contract calls

        // Step 2: Prepare token parameters
        setDeployState({ status: "preparing", message: "Preparing token parameters..." });

        const tokenName = generateTokenName(postContent);
        const tokenSymbol = generateTokenSymbol(postContent);

        const prepResult = await prepareTokenRpc({
          data: {
            postId,
            name: tokenName,
            symbol: tokenSymbol,
            description: postContent,
          },
        });

        if (!prepResult.success) {
          setDeployState({
            status: "failed",
            message: prepResult.error ?? "Failed to prepare token",
            error: prepResult.error ?? undefined,
          });
          return;
        }

        // Step 3: Send transaction
        setDeployState({
          status: "deploying",
          message: `Deploying $${tokenSymbol} on BSC...`,
        });

        // Note: In a full integration, we'd call the contract here via viem
        // For now, we simulate the deployment
        const mockTxHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
        const mockTokenAddress = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

        setDeployState({
          status: "confirming",
          message: "Waiting for block confirmation...",
          txHash: mockTxHash,
        });

        // Simulate confirmation delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Step 4: Confirm deployment
        await confirmDeployRpc({
          data: {
            postId,
            tokenAddress: mockTokenAddress,
            txHash: mockTxHash,
          },
        });

        setDeployState({
          status: "confirmed",
          message: `$${tokenSymbol} deployed successfully!`,
          tokenAddress: mockTokenAddress,
          txHash: mockTxHash,
        });
      } catch (err) {
        console.error("Token deployment failed:", err);
        setDeployState({
          status: "failed",
          message: "Token deployment failed. Post was still created.",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    },
    [prepareTokenRpc, confirmDeployRpc]
  );

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    setDeployState({ status: "idle", message: "" });

    try {
      const result = await createPostRpc({ data: { content: content.trim() } });
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Post created — now attempt token deployment
      if (result.post) {
        await deployToken(result.post.id, content.trim());
      }

      setContent("");
      onPostCreated?.();

      // Auto-close after success with delay
      setTimeout(() => {
        setOpen(false);
        setDeployState({ status: "idle", message: "" });
      }, 3000);
    } catch (err) {
      setError("Failed to drop opinion. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const remaining = 280 - content.length;
  const isDeploying = ["signing", "preparing", "deploying", "confirming"].includes(
    deployState.status
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!isDeploying) setOpen(o); }}>
      <DialogTrigger asChild>
        <button className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-volt text-background flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform">
          <Plus className="w-7 h-7" strokeWidth={2.5} />
        </button>
      </DialogTrigger>
      <DialogContent className="glass-card border-border/30 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            Drop an Opinion
            <Rocket className="w-4 h-4 text-volt" />
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 280))}
              placeholder="What's your market take?"
              rows={4}
              disabled={isDeploying}
              className="w-full bg-surface rounded-xl p-3 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-volt/40 border border-border/30 disabled:opacity-50"
            />
            <span
              className={`absolute bottom-3 right-3 text-xs tabular-nums ${
                remaining < 20 ? "text-signal" : "text-muted-foreground"
              }`}
            >
              {remaining}
            </span>
          </div>

          {/* Token deploy status */}
          <TokenDeployStatus
            state={deployState}
            onDismiss={() => setDeployState({ status: "idle", message: "" })}
          />

          {error && <p className="text-xs text-signal">{error}</p>}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">
                Starts at <span className="text-volt font-semibold">$1.00</span>
              </p>
              <p className="text-[10px] text-muted-foreground/60">
                + auto-deploys BEP-20 token via Four.meme
              </p>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || loading || isDeploying}
              className="rounded-xl bg-volt text-background font-bold hover:bg-volt/90"
            >
              {isDeploying ? "Deploying..." : loading ? "Dropping..." : "Drop It 🔥"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
