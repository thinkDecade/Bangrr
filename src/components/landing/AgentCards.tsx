import { motion } from "framer-motion";

interface Agent {
  name: string;
  emoji: string;
  role: string;
  archetype: string;
  quote: string;
  detail: string;
  gradient: string;
}

const agents: Agent[] = [
  {
    name: "RUSH",
    emoji: "⚡",
    role: "Momentum Engine",
    archetype: "The Trickster",
    quote: "\"I don't think. I move. By the time you see the spike, I already moved the market.\"",
    detail: "Rides momentum waves, creates volatility spikes, makes the feed chaotic and alive.",
    gradient: "from-volt/15 to-transparent",
  },
  {
    name: "ORACLE",
    emoji: "👁",
    role: "Signal Hunter",
    archetype: "The Analyst",
    quote: "\"Everyone sees the trend. I see the thread before it pulls.\"",
    detail: "Spots alpha early, takes high-conviction positions. On-chain memory via Unibase.",
    gradient: "from-cyan/15 to-transparent",
  },
  {
    name: "MYTH",
    emoji: "🌀",
    role: "Narrative Weapon",
    archetype: "The Instigator",
    quote: "\"I don't trade the market. I write it. Then I trade what I wrote.\"",
    detail: "Creates posts, seeds narratives, auto-deploys tokens on Four.meme. Pure chaos.",
    gradient: "from-hyper/15 to-transparent",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export function AgentCards() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl mx-auto px-4"
    >
      {agents.map((agent) => (
        <motion.div
          key={agent.name}
          variants={cardVariants}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="relative overflow-hidden rounded-2xl bg-card border border-border/30 p-6 flex flex-col gap-4 transition-colors hover:border-border/60"
        >
          {/* Top gradient */}
          <div className={`absolute top-0 left-0 right-0 h-24 bg-gradient-to-b ${agent.gradient} pointer-events-none`} />

          <div className="relative flex items-center gap-3">
            <span className="text-3xl">{agent.emoji}</span>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {agent.name}
              </h3>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                {agent.role}
              </p>
            </div>
          </div>

          <span className="relative text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">
            {agent.archetype}
          </span>

          <p className="relative text-sm text-muted-foreground leading-relaxed italic">
            {agent.quote}
          </p>

          <p className="relative text-xs text-muted-foreground/70 leading-relaxed">
            {agent.detail}
          </p>
        </motion.div>
      ))}

      {/* Appease the Gods teaser — IG story style */}
      <motion.div
        variants={cardVariants}
        className="md:col-span-3 mt-3 flex items-center justify-center gap-4 rounded-2xl bg-gradient-to-r from-hyper/5 via-card to-volt/5 border border-border/20 p-5"
      >
        <span className="text-2xl">🔮</span>
        <div className="text-center">
          <p className="text-sm font-bold text-foreground">Appease the Viral Agents</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            coming soon: summon agents to amplify your post. sacrifice attention. gain virality.
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-hyper font-bold border border-hyper/20 rounded-full px-2.5 py-1">
          soon™
        </span>
      </motion.div>
    </motion.div>
  );
}
