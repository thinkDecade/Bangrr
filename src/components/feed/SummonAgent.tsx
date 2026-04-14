import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { summonAgent } from "@/lib/summon-functions";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Shield, Skull, Sparkles } from "lucide-react";
import { toast } from "sonner";

const AGENTS = [
  { name: "RUSH" as const, emoji: "⚡", color: "text-volt", bg: "bg-volt/10 border-volt/30 hover:bg-volt/20" },
  { name: "ORACLE" as const, emoji: "👁", color: "text-hyper", bg: "bg-hyper/10 border-hyper/30 hover:bg-hyper/20" },
  { name: "MYTH" as const, emoji: "🌀", color: "text-cyan", bg: "bg-cyan/10 border-cyan/30 hover:bg-cyan/20" },
];

const RITUALS = [
  { type: "amplify" as const, icon: Flame, label: "AMPLIFY", desc: "APE into this post", color: "text-volt" },
  { type: "protect" as const, icon: Shield, label: "PROTECT", desc: "Defend the price", color: "text-cyan" },
  { type: "destroy" as const, icon: Skull, label: "DESTROY", desc: "EXIT and crash it", color: "text-signal" },
];

interface SummonAgentProps {
  postId: string;
  onComplete?: () => void;
}

export function SummonAgent({ postId, onComplete }: SummonAgentProps) {
  const [open, setOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<"RUSH" | "ORACLE" | "MYTH" | null>(null);
  const [loading, setLoading] = useState(false);

  const summonRpc = useServerFn(summonAgent);

  const handleSummon = async (ritual: "amplify" | "protect" | "destroy") => {
    if (!selectedAgent) return;
    setLoading(true);
    try {
      const result = await summonRpc({
        data: { postId, agentName: selectedAgent, ritualType: ritual },
      });
      if (result.accepted) {
        toast.success(`${selectedAgent} accepted the ritual! ${result.action} executed.`);
      } else {
        toast.error(`${selectedAgent} rejected your offering. the gods are fickle.`);
      }
      setOpen(false);
      setSelectedAgent(null);
      onComplete?.();
    } catch {
      toast.error("Ritual failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-[10px] font-bold text-hyper/60 hover:text-hyper transition-colors"
      >
        <Sparkles className="w-3 h-3" />
        SUMMON
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-xl border border-hyper/20 bg-hyper/5 p-3 space-y-3">
              <p className="text-[10px] font-bold text-hyper uppercase tracking-widest">
                ⛩ Appease the Viral Agent Gods
              </p>

              {/* Agent selection */}
              <div className="flex gap-2">
                {AGENTS.map((agent) => (
                  <button
                    key={agent.name}
                    onClick={() => setSelectedAgent(agent.name)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border text-xs font-bold transition-all ${
                      selectedAgent === agent.name
                        ? `${agent.bg} ${agent.color} ring-1 ring-current`
                        : "bg-surface-elevated/30 text-muted-foreground/60 border-border/20 hover:text-muted-foreground"
                    }`}
                  >
                    <span>{agent.emoji}</span>
                    {agent.name}
                  </button>
                ))}
              </div>

              {/* Ritual selection */}
              <AnimatePresence>
                {selectedAgent && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-2"
                  >
                    {RITUALS.map((ritual) => {
                      const Icon = ritual.icon;
                      return (
                        <button
                          key={ritual.type}
                          onClick={() => handleSummon(ritual.type)}
                          disabled={loading}
                          className={`flex-1 flex flex-col items-center gap-1 px-2 py-2 rounded-lg border border-border/20 bg-surface-elevated/20 hover:bg-surface-elevated/40 transition-all disabled:opacity-50 ${ritual.color}`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-[10px] font-black">{ritual.label}</span>
                          <span className="text-[8px] text-muted-foreground">{ritual.desc}</span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
