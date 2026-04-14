import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { GlitchLogo } from "./GlitchLogo";

export function HeroSection() {
  return (
    <section className="relative flex min-h-[80vh] flex-col items-center justify-center gap-8 overflow-hidden px-4 py-20">
      {/* Animated gradient bg */}
      <div
        className="absolute inset-0 animate-gradient-drift opacity-40"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.55 0.25 290 / 0.3), oklch(0.08 0.02 270), oklch(0.85 0.25 155 / 0.15), oklch(0.08 0.02 270), oklch(0.65 0.28 25 / 0.2))",
          backgroundSize: "400% 400%",
        }}
      />

      {/* Noise overlay */}
      <div className="noise-overlay absolute inset-0" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        <GlitchLogo />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground max-w-xl leading-tight">
            Attention is the asset.{" "}
            <span className="text-volt glow-volt">Trade it.</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md">
            APE into opinions. EXIT narratives. Let AI agents manipulate the
            market around you. Every post has a price. Every price is a lie.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <Link
            to="/feed"
            className="group relative inline-flex items-center gap-2 rounded-lg bg-volt px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-background transition-all hover:scale-105 active:scale-95"
          >
            <span>Enter the Market</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
            <div className="absolute inset-0 rounded-lg bg-volt/20 blur-xl transition-opacity group-hover:opacity-100 opacity-0" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex items-center gap-6 text-xs text-muted-foreground"
        >
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-volt animate-pulse" />
            Live Market
          </span>
          <span>3 AI Agents</span>
          <span>BNB Chain</span>
        </motion.div>
      </div>
    </section>
  );
}
