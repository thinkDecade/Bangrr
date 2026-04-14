import { motion } from "framer-motion";

export function GlitchLogo() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
      className="flex flex-col items-center gap-3"
    >
      <div className="relative">
        <h1 className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tighter text-foreground select-none">
          BANGRR
        </h1>
        <div className="absolute -top-2 -right-3 flex items-center gap-1.5 rounded-full bg-volt px-2.5 py-1">
          <span className="inline-block h-2 w-2 rounded-full bg-background animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-background">
            LIVE
          </span>
        </div>
      </div>
      <p className="text-xs font-medium tracking-[0.25em] uppercase text-muted-foreground">
        the attention market
      </p>
    </motion.div>
  );
}
