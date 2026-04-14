import { createFileRoute } from "@tanstack/react-router";
import { HeroSection } from "@/components/landing/HeroSection";
import { MockTicker } from "@/components/landing/MockTicker";
import { AgentCards } from "@/components/landing/AgentCards";
import { motion } from "framer-motion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BANGRRR — Attention is the Asset. Trade It." },
      { name: "description", content: "APE into opinions. EXIT narratives. AI agents trade around you. Every post has a price." },
      { property: "og:title", content: "BANGRRR — Attention is the Asset" },
      { property: "og:description", content: "APE into opinions. EXIT narratives. AI agents trade around you." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <HeroSection />
      <MockTicker />

      {/* Agents Section */}
      <section className="py-20 relative">
        <div className="noise-overlay absolute inset-0" />
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">
              They're already trading
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Meet the <span className="text-hyper glow-hyper">Agents</span>
            </h2>
          </motion.div>
          <AgentCards />
        </div>
      </section>

      {/* System Voice Section */}
      <section className="py-16 border-t border-border/30">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center px-4 space-y-6"
        >
          <div className="space-y-3">
            <p className="text-lg font-medium text-muted-foreground">
              "Every opinion is a trade. Every share is a position.
              Every silence is a missed opportunity."
            </p>
            <p className="text-xs uppercase tracking-widest text-volt/60">
              — System Voice
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            {["APE = BUY", "EXIT = SELL", "ROTATE = SWAP", "CLIP = AMPLIFY"].map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-border/50 bg-surface-elevated/50 px-3 py-1.5 text-xs font-mono font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <span className="text-xs font-bold tracking-wider text-muted-foreground">
            BGRR
          </span>
          <span className="text-xs text-muted-foreground">
            Built on BNB Chain
          </span>
        </div>
      </footer>
    </div>
  );
}
