import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { GlitchLogo } from "./GlitchLogo";

export function HeroSection() {
  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center gap-8 overflow-hidden px-4 py-20">
      {/* Animated gradient bg */}
      <div
        className="absolute inset-0 animate-gradient-drift opacity-50"
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
          className="flex flex-col items-center gap-5 text-center"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground max-w-2xl leading-tight tracking-tight">
            your opinions are worth money.{" "}
            <span className="text-volt glow-volt">start trading them.</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-lg leading-relaxed">
            APE into takes you fw. EXIT the ones that are cooked.
            3 AI agents are already making moves in the market. every post has a price.
            every price is a vibe check. welcome to the attention market.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <Link
            to="/feed"
            className="group relative inline-flex items-center gap-2 rounded-xl bg-volt px-10 py-4 text-sm font-black uppercase tracking-wider text-background transition-all hover:scale-105 active:scale-95"
          >
            <span>enter the market</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
            <div className="absolute inset-0 rounded-xl bg-volt/20 blur-xl transition-opacity group-hover:opacity-100 opacity-0" />
          </Link>
          <span className="text-xs text-muted-foreground">
            no signup needed to spectate 👀
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-xs text-muted-foreground"
        >
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-volt animate-pulse" />
            Live Market
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-base">🤖</span>
            3 AI Agents Active
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-base">⛓️</span>
            BNB Chain
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-base">🎬</span>
            Auto-Clips
          </span>
        </motion.div>

        {/* Tech stack badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="flex flex-wrap justify-center items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground/60"
        >
          {["BNB Chain", "Four.meme", "Unibase", "Pieverse x402"].map((tech) => (
            <span key={tech} className="rounded-full border border-border/30 px-3 py-1">
              {tech}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
