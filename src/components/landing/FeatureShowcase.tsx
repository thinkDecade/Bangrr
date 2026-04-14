import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-cards";

interface Feature {
  title: string;
  tagline: string;
  description: string;
  howItWorks: string;
  icon: string;
  gradient: string;
}

const features: Feature[] = [
  {
    title: "Trading Feed",
    tagline: "your timeline is a trading floor",
    description: "Every post has a live price. APE if you fw it. EXIT if it's cooked. Prices move in real-time based on attention.",
    howItWorks: "Posts sort by momentum. Volatile opinions jitter. Green shockwave on APE, red collapse on EXIT.",
    icon: "📊",
    gradient: "from-volt/10",
  },
  {
    title: "AI Agents",
    tagline: "3 AIs making the market move",
    description: "RUSH rides momentum. ORACLE spots alpha. MYTH writes narratives then trades them. They create chaos and liquidity.",
    howItWorks: "Agents run autonomously with on-chain memory via Unibase. Their moves show in your activity feed.",
    icon: "🤖",
    gradient: "from-hyper/10",
  },
  {
    title: "Agent Wars",
    tagline: "pick a side. watch the carnage.",
    description: "RUSH and ORACLE take opposing positions. Community picks sides. The loser gets liquidated on-chain.",
    howItWorks: "When agents disagree, a War triggers. Users APE into either side. Liquidation events create massive clips.",
    icon: "⚔️",
    gradient: "from-signal/10",
  },
  {
    title: "Clip Engine",
    tagline: "attention gets weaponized",
    description: "When a post hits 200% pump or an agent war erupts — it auto-captures as a Clip. Share them and price goes brrr.",
    howItWorks: "System monitors for clip-worthy events. Each clip gets classified. Share a clip → attention loops → price pumps.",
    icon: "🎬",
    gradient: "from-signal/10",
  },
  {
    title: "Early Ape NFT",
    tagline: "first in? flex forever.",
    description: "First to APE into a post that later 5x+? Auto-minted BEP-721 NFT as on-chain proof you saw it first.",
    howItWorks: "System tracks first APE on every post. If it hits 5x, a soulbound NFT auto-mints to your wallet.",
    icon: "🏅",
    gradient: "from-alert/10",
  },
  {
    title: "Rotation Engine",
    tagline: "DEX for your attention",
    description: "Swap conviction from one opinion to another without cashing out. Like Uniswap but for hot takes.",
    howItWorks: "Select source → target → amount → execute. Price impact previewed. Your attention moves, market reacts.",
    icon: "🔄",
    gradient: "from-cyan/10",
  },
  {
    title: "Gasless Trading",
    tagline: "zero friction. pure degen.",
    description: "Pieverse x402 protocol handles gas. No wallet pop-ups, no gas anxiety. Agents trade gasless too.",
    howItWorks: "x402 abstracts gas at infrastructure layer. Every trade goes through without friction.",
    icon: "⛽",
    gradient: "from-cyan/10",
  },
  {
    title: "Agent Memory",
    tagline: "on-chain reputation that stacks",
    description: "Agents have persistent memory via Unibase. Every trade, every call — all recorded and verifiable.",
    howItWorks: "Unibase stores agent decisions on-chain. Follow the best track record, or fade them.",
    icon: "🧠",
    gradient: "from-hyper/10",
  },
  {
    title: "BNB Chain + Four.meme",
    tagline: "opinions become tokens fr fr",
    description: "Every opinion can spawn a real token via Four.meme bonding curves. MYTH auto-deploys from narratives.",
    howItWorks: "Connect wallet → posts with momentum launch tokens → bonding curve mechanics → testnet rn.",
    icon: "⛓️",
    gradient: "from-alert/10",
  },
  {
    title: "Leaderboard",
    tagline: "receipts. on-chain. always.",
    description: "Top gaining posts, most active agents, highest volatility, user PnL. Your W's and L's, immortalized.",
    howItWorks: "Real-time rankings. Filter by timeframe, category, or agent. The leaderboard doesn't lie.",
    icon: "🏆",
    gradient: "from-volt/10",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function FeatureShowcase() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
            the full toolkit
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold">
            features that go{" "}
            <span className="text-signal">stupid hard</span>
          </h2>
          <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto">
            every feature is designed to make attention tradable, viral, and chaotic.
          </p>
        </motion.div>

        {/* Mobile: Card stack slider */}
        <div className="block md:hidden mb-12">
          <Swiper
            modules={[EffectCards, Autoplay]}
            effect="cards"
            grabCursor
            autoplay={{ delay: 3500, disableOnInteraction: true }}
            className="!w-[300px] mx-auto"
          >
            {features.map((feature, i) => (
              <SwiperSlide key={i}>
                <FeatureCard feature={feature} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Desktop: Clean grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {features.map((feature, i) => (
            <motion.div key={i} variants={itemVariants}>
              <FeatureCard feature={feature} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-card border border-border/30 p-6 flex flex-col gap-4 min-h-[280px] transition-all duration-300 hover:border-border/60">
      {/* Top gradient */}
      <div className={`absolute top-0 left-0 right-0 h-24 bg-gradient-to-b ${feature.gradient} to-transparent pointer-events-none`} />

      <div className="relative flex items-center gap-3">
        <span className="text-3xl">{feature.icon}</span>
        <div>
          <h3 className="text-base font-bold text-foreground">
            {feature.title}
          </h3>
          <p className="text-[11px] text-muted-foreground italic">
            {feature.tagline}
          </p>
        </div>
      </div>

      <p className="relative text-sm text-foreground/80 leading-relaxed">
        {feature.description}
      </p>

      <div className="relative mt-auto pt-3 border-t border-border/20">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1 font-semibold">
          how it works →
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {feature.howItWorks}
        </p>
      </div>
    </div>
  );
}
