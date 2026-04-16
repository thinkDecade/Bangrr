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
import { generateTokenName, generateTokenSymbol } from "@/lib/fourmeme-contract";
import type { DeploymentState } from "@/lib/fourmeme-contract";
import { useFourMemeDeploy } from "@/lib/use-fourmeme-deploy";
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

  const { deploy, isReady: walletReady } = useFourMemeDeploy();

  const deployToken = useCallback(
    async (postId: string, postContent: string) => {
      try {
        if (!walletReady) {
          setDeployState({
            status: "failed",
            message: "Connect a wallet to deploy a token. Post is live without one.",
          });
          return;
        }

        setDeployState({ status: "preparing", message: "Preparing token parameters..." });

        const tokenName = generateTokenName(postContent);
        const tokenSymbol = generateTokenSymbol(postContent);

        const prepResult = await prepareTokenRpc({
          data: { postId, name: tokenName, symbol: tokenSymbol, description: postContent },
        });

        if (!prepResult.success) {
          setDeployState({
            status: "failed",
            message: prepResult.error ?? "Failed to prepare token",
            error: prepResult.error ?? undefined,
          });
          return;
        }

        setDeployState({
          status: "signing",
          message: `Sign in wallet to deploy $${tokenSymbol} (0.01 BNB fee)...`,
        });

        const { txHash, tokenAddress } = await deploy({
          name: tokenName,
          symbol: tokenSymbol,
          description: postContent,
          launchTime: prepResult.launchTime!,
          nonce: prepResult.nonce!,
        });

        setDeployState({
          status: "confirming",
          message: "Tx submitted — waiting for confirmation...",
          txHash,
        });

        await confirmDeployRpc({
          data: { postId, tokenAddress, txHash },
        });

        setDeployState({
          status: "confirmed",
          message: `$${tokenSymbol} live on BSC Testnet!`,
          tokenAddress,
          txHash,
        });
      } catch (err) {
        console.error("Token deployment failed:", err);
        const msg = err instanceof Error ? err.message : "Unknown error";
        setDeployState({
          status: "failed",
          message: msg.includes("User rejected") || msg.includes("rejected")
            ? "Wallet signature rejected. Post is live without a token."
            : "Token deploy failed. Post is still live.",
          error: msg,
        });
      }
    },
    [prepareTokenRpc, confirmDeployRpc, deploy, walletReady]
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
