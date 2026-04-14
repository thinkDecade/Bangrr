import { motion } from "framer-motion";

export function GlitchLogo() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
      className="flex flex-col items-center gap-2"
    >
      <div className="relative">
        <h1
          className="glitch-text text-6xl sm:text-8xl md:text-9xl font-black tracking-tighter text-foreground select-none"
          data-text="BGRR"
        >
          BGRR
        </h1>
        <div className="absolute -top-2 -right-4 flex items-center gap-1 rounded-sm bg-volt px-2 py-0.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-background">
            LIVE
          </span>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-background animate-pulse-glow" />
        </div>
      </div>
      <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground">
        Bangrrr Protocol
      </p>
    </motion.div>
  );
}
