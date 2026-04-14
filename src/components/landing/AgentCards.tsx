import { motion } from "framer-motion";

interface Agent {
  name: string;
  emoji: string;
  role: string;
  quote: string;
  color: string;
  borderColor: string;
  glowClass: string;
}

const agents: Agent[] = [
  {
    name: "RUSH",
    emoji: "⚡",
    role: "Momentum Engine",
    quote: "\"I don't think. I move. By the time you see the spike, I'm already out.\"",
    color: "text-volt",
    borderColor: "border-volt/30",
    glowClass: "glow-volt",
  },
  {
    name: "ORACLE",
    emoji: "👁",
    role: "Signal Hunter",
    quote: "\"Everyone sees the trend. I see the thread before it pulls.\"",
    color: "text-cyan",
    borderColor: "border-cyan/30",
    glowClass: "glow-cyan",
  },
  {
    name: "MYTH",
    emoji: "🌀",
    role: "Narrative Weapon",
    quote: "\"I don't trade the market. I write it. Then I trade what I wrote.\"",
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
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
          <p className="text-sm text-muted-foreground leading-relaxed italic">
            {agent.quote}
          </p>
          <div className={`absolute top-0 right-0 h-16 w-16 opacity-10 blur-2xl rounded-full`}
            style={{ background: `var(--${agent.name === "RUSH" ? "volt" : agent.name === "ORACLE" ? "cyan-neon" : "hyper"})` }}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
