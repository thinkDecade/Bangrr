import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";

export function SystemVoiceCTA() {
  return (
    <section className="relative py-28 overflow-hidden">
      {/* Soft radial gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, oklch(0.6 0.28 290 / 0.06) 0%, transparent 60%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative z-10 max-w-2xl mx-auto text-center px-4 space-y-10"
      >
        <div className="space-y-4">
          <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground leading-tight">
            "the market doesn't care about your feelings.{" "}
            <span className="text-signal">it trades them.</span>"
          </p>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/50 font-semibold">
            — System Voice
          </p>
        </div>

        {/* Vocabulary pills — IG/TikTok badge style */}
        <div className="flex flex-wrap justify-center gap-2.5">
          {[
            { label: "APE", desc: "= BUY", color: "text-volt bg-volt/10 border-volt/20" },
            { label: "EXIT", desc: "= SELL", color: "text-signal bg-signal/10 border-signal/20" },
            { label: "ROTATE", desc: "= SWAP", color: "text-cyan bg-cyan/10 border-cyan/20" },
            { label: "CLIP", desc: "= AMPLIFY", color: "text-hyper bg-hyper/10 border-hyper/20" },
          ].map((tag) => (
            <span
              key={tag.label}
              className={`rounded-full border px-4 py-2 text-sm font-mono font-bold ${tag.color}`}
            >
              {tag.label}
              <span className="text-foreground/50 font-normal"> {tag.desc}</span>
            </span>
          ))}
        </div>

        <div className="flex flex-col items-center gap-3">
          <Link
            to="/feed"
            className="group inline-flex items-center gap-2.5 rounded-2xl bg-volt px-10 py-4 text-sm font-bold uppercase tracking-wider text-background transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
          >
            <span>ape in now</span>
            <span className="transition-transform group-hover:translate-x-0.5">🧨</span>
          </Link>
          <p className="text-xs text-muted-foreground">
            nfa. dyor. but also... you're already late.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
