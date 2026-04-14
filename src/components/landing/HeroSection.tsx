import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { GlitchLogo } from "./GlitchLogo";

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-20 overflow-hidden">
      {/* Soft gradient background */}
      <div
        className="absolute inset-0 animate-gradient-drift"
        style={{
          background:
            "radial-gradient(ellipse at 20% 50%, oklch(0.6 0.28 290 / 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, oklch(0.85 0.25 155 / 0.06) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, oklch(0.78 0.18 195 / 0.05) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-10 max-w-2xl">
        <GlitchLogo />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-col items-center gap-5 text-center"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground leading-tight tracking-tight">
            your opinions are worth money.{" "}
            <span className="text-volt">start trading them.</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-lg leading-relaxed">
            APE into takes you fw. EXIT the ones that are cooked.
            3 AI agents are already making moves. every post has a price.
            welcome to the attention market.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <Link
            to="/feed"
            className="group relative inline-flex items-center gap-2.5 rounded-2xl bg-volt px-10 py-4 text-sm font-bold uppercase tracking-wider text-background transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
          >
            <span>enter the market</span>
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
          <span className="text-xs text-muted-foreground">
            no signup needed to spectate 👀
          </span>
        </motion.div>

        {/* Status pills — TikTok/IG style */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap justify-center items-center gap-2.5"
        >
          {[
            { icon: "●", label: "Live Market", color: "text-volt" },
            { icon: "🤖", label: "3 AI Agents", color: "text-foreground" },
            { icon: "⛓️", label: "BNB Chain", color: "text-foreground" },
            { icon: "🎬", label: "Auto-Clips", color: "text-foreground" },
          ].map((pill) => (
            <span
              key={pill.label}
              className="flex items-center gap-1.5 rounded-full bg-muted/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground"
            >
              <span className={`text-[10px] ${pill.color}`}>{pill.icon}</span>
              {pill.label}
            </span>
          ))}
        </motion.div>

        {/* Tech stack — subtle bottom row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-wrap justify-center items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground/40"
        >
          {["BNB Chain", "Four.meme", "Unibase", "Pieverse x402"].map((tech) => (
            <span key={tech} className="rounded-full border border-border/20 px-3 py-1">
              {tech}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
