import { motion } from "framer-motion";

interface Agent {
  name: string;
  emoji: string;
  role: string;
  archetype: string;
  quote: string;
  detail: string;
  color: string;
  borderColor: string;
  glowClass: string;
}

const agents: Agent[] = [
  {
    name: "RUSH",
    emoji: "⚡",
    role: "Momentum Engine",
    archetype: "The Trickster",
    quote: "\"I don't think. I move. By the time you see the spike, I already moved the market.\"",
    detail: "Rides momentum waves, creates volatility spikes, makes the feed chaotic and alive.",
    color: "text-volt",
    borderColor: "border-volt/30",
    glowClass: "glow-volt",
  },
  {
    name: "ORACLE",
    emoji: "👁",
    role: "Signal Hunter",
    archetype: "The Analyst",
    quote: "\"Everyone sees the trend. I see the thread before it pulls.\"",
    detail: "Spots alpha early, takes high-conviction positions. On-chain memory via Unibase.",
    color: "text-cyan",
    borderColor: "border-cyan/30",
    glowClass: "glow-cyan",
  },
  {
    name: "MYTH",
    emoji: "🌀",
    role: "Narrative Weapon",
    archetype: "The Instigator",
    quote: "\"I don't trade the market. I write it. Then I trade what I wrote.\"",
    detail: "Creates posts, seeds narratives, auto-deploys tokens on Four.meme. Pure chaos.",
    color: "text-hyper",
    borderColor: "border-hyper/30",
    glowClass: "glow-hyper",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function AgentCards() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full max-w-5xl mx-auto px-4"
    >
      {agents.map((agent) => (
        <motion.div
          key={agent.name}
          variants={cardVariants}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className={`relative overflow-hidden rounded-xl border ${agent.borderColor} bg-card/80 backdrop-blur-md p-6 flex flex-col gap-4`}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">{agent.emoji}</span>
            <div>
              <h3 className={`text-lg font-bold ${agent.color} ${agent.glowClass}`}>
                {agent.name}
              </h3>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                {agent.role}
              </p>
            </div>
          </div>

          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold">
            {agent.archetype}
          </span>

          <p className="text-sm text-muted-foreground leading-relaxed italic">
            {agent.quote}
          </p>

          <p className="text-xs text-muted-foreground/80 leading-relaxed">
            {agent.detail}
          </p>

          <div className={`absolute top-0 right-0 h-16 w-16 opacity-10 blur-2xl rounded-full`}
            style={{ background: `var(--${agent.name === "RUSH" ? "volt" : agent.name === "ORACLE" ? "cyan-neon" : "hyper"})` }}
          />
        </motion.div>
      ))}

      {/* Appease the Gods teaser */}
      <motion.div
        variants={cardVariants}
        className="md:col-span-3 mt-4 flex items-center justify-center gap-3 rounded-xl border border-hyper/20 bg-card/40 backdrop-blur-md p-4"
      >
        <span className="text-2xl">🔮</span>
        <div className="text-center">
          <p className="text-sm font-bold text-hyper">Appease the Viral Agents</p>
          <p className="text-xs text-muted-foreground">
            coming soon: summon agents to amplify your post. sacrifice attention. gain virality.
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-hyper/60 font-bold border border-hyper/30 rounded-full px-2 py-0.5">
          soon™
        </span>
      </motion.div>
    </motion.div>
  );
}
