import { motion, AnimatePresence } from "framer-motion";
import type { DeploymentState } from "@/lib/fourmeme-contract";
import { ExternalLink, Loader2, CheckCircle, XCircle, Rocket } from "lucide-react";

interface TokenDeployStatusProps {
  state: DeploymentState;
  onDismiss?: () => void;
}

const BSC_TESTNET_EXPLORER = "https://testnet.bscscan.com";

function getStatusConfig(status: DeploymentState["status"]) {
  switch (status) {
    case "signing":
      return { icon: Loader2, color: "text-alert", spin: true, label: "Sign wallet..." };
    case "preparing":
      return { icon: Loader2, color: "text-hyper", spin: true, label: "Preparing token..." };
    case "deploying":
      return { icon: Rocket, color: "text-volt", spin: false, label: "Deploying on-chain..." };
    case "confirming":
      return { icon: Loader2, color: "text-cyan", spin: true, label: "Confirming tx..." };
    case "confirmed":
      return { icon: CheckCircle, color: "text-volt", spin: false, label: "Token live!" };
    case "failed":
      return { icon: XCircle, color: "text-signal", spin: false, label: "Deploy failed" };
    default:
      return null;
  }
}

export function TokenDeployStatus({ state, onDismiss }: TokenDeployStatusProps) {
  const config = getStatusConfig(state.status);
  if (!config || state.status === "idle") return null;

  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="overflow-hidden"
      >
        <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${
          state.status === "confirmed"
            ? "border-volt/30 bg-volt/5"
            : state.status === "failed"
            ? "border-signal/30 bg-signal/5"
            : "border-hyper/30 bg-hyper/5"
        }`}>
          <Icon className={`w-5 h-5 ${config.color} shrink-0 ${config.spin ? "animate-spin" : ""}`} />
          
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${config.color}`}>
              {config.label}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {state.message}
            </p>
          </div>

          {state.tokenAddress && (
            <a
              href={`${BSC_TESTNET_EXPLORER}/token/${state.tokenAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-cyan hover:text-cyan/80 flex items-center gap-1 shrink-0"
            >
              BSCScan <ExternalLink className="w-3 h-3" />
            </a>
          )}

          {state.txHash && !state.tokenAddress && (
            <a
              href={`${BSC_TESTNET_EXPLORER}/tx/${state.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 shrink-0"
            >
              Tx <ExternalLink className="w-3 h-3" />
            </a>
          )}

          {(state.status === "confirmed" || state.status === "failed") && onDismiss && (
            <button
              onClick={onDismiss}
              className="text-xs text-muted-foreground hover:text-foreground ml-1"
            >
              ×
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Compact token badge for PostCard
 */
export function TokenBadge({ tokenAddress }: { tokenAddress: string }) {
  const shortAddr = `${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}`;

  return (
    <a
      href={`${BSC_TESTNET_EXPLORER}/token/${tokenAddress}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-volt/10 border border-volt/20 text-[10px] font-mono text-volt hover:bg-volt/20 transition-colors"
    >
      <Rocket className="w-3 h-3" />
      {shortAddr}
      <ExternalLink className="w-2.5 h-2.5" />
    </a>
  );
}
