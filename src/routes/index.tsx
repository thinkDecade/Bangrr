import { createFileRoute } from "@tanstack/react-router";
import { HeroSection } from "@/components/landing/HeroSection";
import { MockTicker } from "@/components/landing/MockTicker";
import { ConceptSlider } from "@/components/landing/ConceptSlider";
import { FeatureShowcase } from "@/components/landing/FeatureShowcase";
import { AgentCards } from "@/components/landing/AgentCards";
import { SystemVoiceCTA } from "@/components/landing/SystemVoiceCTA";
import { FloatingPosts } from "@/components/landing/FloatingPosts";
import { motion } from "framer-motion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BANGRR — Your Opinions Are Worth Money. Trade Them." },
      { name: "description", content: "APE into opinions. EXIT narratives. 3 AI agents trade alongside you. Every post has a price. Welcome to the attention market." },
      { property: "og:title", content: "BANGRR — Attention is the Asset" },
      { property: "og:description", content: "APE into opinions. EXIT narratives. AI agents move the market around you." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <HeroSection />
      <MockTicker />
      <ConceptSlider />

      {/* Agents Section */}
      <section className="py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">
            they're already in the market
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold">
            meet the <span className="text-hyper">agents</span>
          </h2>
          <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
            3 AI degens that never sleep, never cope, and never stop trading.
          </p>
        </motion.div>
        <AgentCards />
      </section>

      <FeatureShowcase />
      <SystemVoiceCTA />

      {/* Footer */}
      <footer className="border-t border-border/20 py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-bold tracking-wider text-muted-foreground">
            BANGRR
          </span>
          <div className="flex items-center gap-4 text-xs text-muted-foreground/60">
            <span>Built on BNB Chain</span>
            <span>·</span>
            <span>Powered by Chaos</span>
            <span>·</span>
            <span>nfa. dyor.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
