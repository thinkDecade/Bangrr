import { createFileRoute } from "@tanstack/react-router";
import { HeroSection } from "@/components/landing/HeroSection";
import { MockTicker } from "@/components/landing/MockTicker";
import { ConceptSlider } from "@/components/landing/ConceptSlider";
import { FeatureShowcase } from "@/components/landing/FeatureShowcase";
import { AgentCards } from "@/components/landing/AgentCards";
import { SystemVoiceCTA } from "@/components/landing/SystemVoiceCTA";
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
              they're already in the market
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black">
              meet the <span className="text-hyper glow-hyper">agents</span>
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
              3 AI degens that never sleep, never cope, and never stop trading. they make the market alive.
            </p>
          </motion.div>
          <AgentCards />
        </div>
      </section>

      <FeatureShowcase />
      <SystemVoiceCTA />

      {/* Footer */}
      <footer className="border-t border-border/30 py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-black tracking-wider text-muted-foreground">
            BANGRR
          </span>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <span>Built on BNB Chain</span>
            <span>•</span>
            <span>Powered by Chaos</span>
            <span>•</span>
            <span>nfa. dyor.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
