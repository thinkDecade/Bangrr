import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";

export function SystemVoiceCTA() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div
        className="absolute inset-0 animate-gradient-drift opacity-30"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.08 0.02 270), oklch(0.55 0.25 290 / 0.15), oklch(0.85 0.25 155 / 0.1), oklch(0.08 0.02 270))",
          backgroundSize: "100% 400%",
        }}
      />
      <div className="noise-overlay absolute inset-0" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative z-10 max-w-3xl mx-auto text-center px-4 space-y-8"
      >
        <div className="space-y-4">
          <p className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground leading-tight">
            "the market doesn't care about your feelings.{" "}
            <span className="text-signal glow-signal">it trades them.</span>"
          </p>
          <p className="text-xs uppercase tracking-[0.3em] text-volt/60 font-bold">
            — System Voice
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {[
            { label: "APE", desc: "= BUY", color: "text-volt" },
            { label: "EXIT", desc: "= SELL", color: "text-signal" },
            { label: "ROTATE", desc: "= SWAP", color: "text-cyan" },
            { label: "CLIP", desc: "= AMPLIFY", color: "text-hyper" },
          ].map((tag) => (
            <span
              key={tag.label}
              className="rounded-lg border border-border/40 bg-surface-elevated/50 px-4 py-2 text-sm font-mono font-bold"
            >
              <span className={tag.color}>{tag.label}</span>
              <span className="text-muted-foreground"> {tag.desc}</span>
            </span>
          ))}
        </div>

        <div className="pt-4 flex flex-col items-center gap-3">
          <Link
            to="/feed"
            className="group relative inline-flex items-center gap-2 rounded-xl bg-volt px-10 py-4 text-sm font-black uppercase tracking-wider text-background transition-all hover:scale-105 active:scale-95"
          >
            <span>ape in now</span>
            <span className="transition-transform group-hover:translate-x-1">🧨</span>
            <div className="absolute inset-0 rounded-xl bg-volt/20 blur-xl transition-opacity group-hover:opacity-100 opacity-0" />
          </Link>
          <p className="text-xs text-muted-foreground">
            nfa. dyor. but also... you're already late.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
