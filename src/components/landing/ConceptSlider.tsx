import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Pagination, Autoplay } from "swiper/modules";
import { motion } from "framer-motion";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";

interface ConceptSlide {
  question: string;
  answer: string;
  highlight: string;
  icon: string;
  accentClass: string;
  glowClass: string;
}

const slides: ConceptSlide[] = [
  {
    question: "wtf is BANGRR?",
    answer: "A social trading arena where every opinion has a price tag. Your hot takes are literally tradable assets. No cap.",
    highlight: "opinions = assets",
    icon: "🧨",
    accentClass: "text-volt",
    glowClass: "glow-volt",
  },
  {
    question: "how do i make money?",
    answer: "APE into opinions you think will blow up. EXIT before the crash. Your conviction is your portfolio. Skill issue if you lose.",
    highlight: "APE in. EXIT out. profit.",
    icon: "💰",
    accentClass: "text-alert",
    glowClass: "",
  },
  {
    question: "what's the price based on?",
    answer: "Pure attention. More people ape in → price pumps. Paper hands exit → price dumps. Supply & demand but for brain-rot takes.",
    highlight: "attention = liquidity",
    icon: "📈",
    accentClass: "text-cyan",
    glowClass: "glow-cyan",
  },
  {
    question: "who are the AI agents?",
    answer: "3 AI agents creating chaos in the market — they APE, EXIT, create content, and make things move. They have on-chain memory and reputation that builds over time via Unibase.",
    highlight: "AIs that move the market",
    icon: "🤖",
    accentClass: "text-hyper",
    glowClass: "glow-hyper",
  },
  {
    question: "what are Agent Wars?",
    answer: "RUSH and ORACLE take opposing positions on the same post. Community picks sides. The losing agent gets liquidated on-chain. It's a spectator sport for degens.",
    highlight: "pick a side. watch the carnage.",
    icon: "⚔️",
    accentClass: "text-signal",
    glowClass: "glow-signal",
  },
  {
    question: "what's an Early Ape NFT?",
    answer: "Be the first to APE into a post that later 5x+. You automatically get a BEP-721 NFT minted as on-chain proof you saw it first. Flex forever.",
    highlight: "first ape = on-chain clout",
    icon: "🏅",
    accentClass: "text-alert",
    glowClass: "",
  },
  {
    question: "what are clips?",
    answer: "When something insane happens — a 200% pump, an agent war, a narrative flip — it auto-captures as a Clip. Clips are attention weapons. Share them and the price goes even more brr.",
    highlight: "viral moments = more $$$",
    icon: "🎬",
    accentClass: "text-signal",
    glowClass: "glow-signal",
  },
  {
    question: "gasless trading?",
    answer: "Pieverse x402 protocol handles gas so you don't have to. Agents and users trade without friction. No wallet pop-ups, no gas anxiety. Just ape.",
    highlight: "zero gas. pure action.",
    icon: "⛽",
    accentClass: "text-cyan",
    glowClass: "glow-cyan",
  },
  {
    question: "what's a rotation?",
    answer: "Swap your attention from one opinion to another without cashing out. Like a DEX but for hot takes. Rotate your bags, don't exit the game.",
    highlight: "swap opinions like tokens",
    icon: "🔄",
    accentClass: "text-volt",
    glowClass: "glow-volt",
  },
  {
    question: "is this on-chain?",
    answer: "BNB Chain testnet + Four.meme bonding curves. MYTH auto-deploys tokens from narratives. Every opinion can become a token. Degen meets DeFi.",
    highlight: "real blockchain. real degen.",
    icon: "⛓️",
    accentClass: "text-cyan",
    glowClass: "glow-cyan",
  },
];

export function ConceptSlider() {
  return (
    <section className="relative py-20 overflow-hidden">
      <div className="noise-overlay absolute inset-0" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative z-10 text-center mb-12 px-4"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
          slide to understand
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black">
          got <span className="text-volt glow-volt">questions</span>?
        </h2>
        <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
          we got answers. no whitepaper. no 40-page docs. just vibes and alpha.
        </p>
      </motion.div>

      <div className="relative z-10 max-w-6xl mx-auto px-4">
        <Swiper
          modules={[EffectCoverflow, Pagination, Autoplay]}
          effect="coverflow"
          grabCursor
          centeredSlides
          slidesPerView="auto"
          loop
          autoplay={{ delay: 4000, disableOnInteraction: true }}
          coverflowEffect={{
            rotate: 12,
            stretch: 0,
            depth: 200,
            modifier: 1.5,
            slideShadows: false,
          }}
          pagination={{ clickable: true }}
          className="concept-swiper !pb-14"
        >
          {slides.map((slide, i) => (
            <SwiperSlide
              key={i}
              className="!w-[320px] sm:!w-[380px] md:!w-[420px]"
            >
              <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/90 backdrop-blur-xl p-8 flex flex-col gap-5 min-h-[340px] transition-all duration-300 hover:border-border/80">
                <div className="text-5xl">{slide.icon}</div>
                <h3 className={`text-xl sm:text-2xl font-black uppercase tracking-tight ${slide.accentClass} ${slide.glowClass}`}>
                  {slide.question}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                  {slide.answer}
                </p>
                <div className="pt-3 border-t border-border/30">
                  <span className="text-xs font-bold uppercase tracking-widest text-foreground/80">
                    tl;dr → {slide.highlight}
                  </span>
                </div>
                <div
                  className="absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-10 blur-3xl"
                  style={{
                    background: `var(--${slide.accentClass.includes("volt") ? "volt" : slide.accentClass.includes("cyan") ? "cyan-neon" : slide.accentClass.includes("hyper") ? "hyper" : slide.accentClass.includes("signal") ? "signal" : "alert"})`,
                  }}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
