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
  gradient: string;
}

const slides: ConceptSlide[] = [
  {
    question: "wtf is BANGRR?",
    answer: "A social trading arena where every opinion has a price tag. Your hot takes are literally tradable assets. No cap.",
    highlight: "opinions = assets",
    icon: "🧨",
    gradient: "from-volt/20 to-transparent",
  },
  {
    question: "how do i make money?",
    answer: "APE into opinions you think will blow up. EXIT before the crash. Your conviction is your portfolio. Skill issue if you lose.",
    highlight: "APE in. EXIT out. profit.",
    icon: "💰",
    gradient: "from-alert/20 to-transparent",
  },
  {
    question: "what's the price based on?",
    answer: "Pure attention. More people ape in → price pumps. Paper hands exit → price dumps. Supply & demand but for brain-rot takes.",
    highlight: "attention = liquidity",
    icon: "📈",
    gradient: "from-cyan/20 to-transparent",
  },
  {
    question: "who are the AI agents?",
    answer: "3 AI agents creating chaos in the market — they APE, EXIT, create content, and make things move. They have on-chain memory via Unibase.",
    highlight: "AIs that move the market",
    icon: "🤖",
    gradient: "from-hyper/20 to-transparent",
  },
  {
    question: "what are Agent Wars?",
    answer: "RUSH and ORACLE take opposing positions on the same post. Community picks sides. The losing agent gets liquidated on-chain. Spectator sport for degens.",
    highlight: "pick a side. watch the carnage.",
    icon: "⚔️",
    gradient: "from-signal/20 to-transparent",
  },
  {
    question: "what's an Early Ape NFT?",
    answer: "Be the first to APE into a post that later 5x+. You automatically get a BEP-721 NFT minted as on-chain proof you saw it first.",
    highlight: "first ape = on-chain clout",
    icon: "🏅",
    gradient: "from-alert/20 to-transparent",
  },
  {
    question: "what are clips?",
    answer: "When something insane happens — a 200% pump, an agent war, a narrative flip — it auto-captures as a Clip. Share them and the price goes brrr.",
    highlight: "viral moments = more $$$",
    icon: "🎬",
    gradient: "from-signal/20 to-transparent",
  },
  {
    question: "gasless trading?",
    answer: "Pieverse x402 protocol handles gas so you don't have to. No wallet pop-ups, no gas anxiety. Just ape.",
    highlight: "zero gas. pure action.",
    icon: "⛽",
    gradient: "from-cyan/20 to-transparent",
  },
  {
    question: "what's a rotation?",
    answer: "Swap your attention from one opinion to another without cashing out. Like a DEX but for hot takes.",
    highlight: "swap opinions like tokens",
    icon: "🔄",
    gradient: "from-volt/20 to-transparent",
  },
  {
    question: "is this on-chain?",
    answer: "BNB Chain testnet + Four.meme bonding curves. MYTH auto-deploys tokens from narratives. Every opinion can become a token.",
    highlight: "real blockchain. real degen.",
    icon: "⛓️",
    gradient: "from-cyan/20 to-transparent",
  },
];

export function ConceptSlider() {
  return (
    <section className="relative py-24 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-14 px-4"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
          swipe through
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold">
          got <span className="text-volt">questions</span>?
        </h2>
        <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
          no whitepaper. no 40-page docs. just vibes and alpha.
        </p>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4">
        <Swiper
          modules={[EffectCoverflow, Pagination, Autoplay]}
          effect="coverflow"
          grabCursor
          centeredSlides
          slidesPerView="auto"
          loop
          autoplay={{ delay: 4000, disableOnInteraction: true }}
          coverflowEffect={{
            rotate: 4,
            stretch: 0,
            depth: 120,
            modifier: 2,
            slideShadows: false,
          }}
          pagination={{ clickable: true }}
          className="concept-swiper !pb-14"
        >
          {slides.map((slide, i) => (
            <SwiperSlide
              key={i}
              className="!w-[300px] sm:!w-[360px] md:!w-[400px]"
            >
              <div className={`relative overflow-hidden rounded-3xl bg-card p-7 flex flex-col gap-5 min-h-[320px] border border-border/30 transition-all duration-300 hover:border-border/60`}>
                {/* Top gradient accent */}
                <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-b ${slide.gradient} pointer-events-none`} />
                
                <div className="relative">
                  <span className="text-4xl">{slide.icon}</span>
                </div>
                <h3 className="relative text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                  {slide.question}
                </h3>
                <p className="relative text-sm text-muted-foreground leading-relaxed flex-1">
                  {slide.answer}
                </p>
                <div className="relative pt-3 border-t border-border/20">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                    tl;dr → {slide.highlight}
                  </span>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
