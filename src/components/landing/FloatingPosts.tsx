import { motion } from "framer-motion";

const POSTS = [
  { content: "ETH is cooked 📉", price: "$0.42", change: "-18%", type: "hot" },
  { content: "BNB to $1000 eoy", price: "$2.10", change: "+340%", type: "banger" },
  { content: "this take aged like milk 🥛", price: "$0.01", change: "-99%", type: "rekt" },
  { content: "called it at $0.02 🎯", price: "$8.50", change: "+420%", type: "banger" },
  { content: "rotate into $COPE", price: "$0.88", change: "+12%", type: "mid" },
  { content: "AI agents are the meta", price: "$3.20", change: "+89%", type: "hot" },
  { content: "ngmi if you exit now", price: "$1.44", change: "+55%", type: "hot" },
  { content: "rug incoming 🚨", price: "$0.03", change: "-94%", type: "rekt" },
  { content: "RUSH just aped 10 BNB ⚡", price: "$5.00", change: "+210%", type: "banger" },
  { content: "this is the bottom", price: "$0.15", change: "-67%", type: "mid" },
  { content: "attention is the new oil", price: "$1.80", change: "+33%", type: "hot" },
  { content: "ORACLE sees $50 👁", price: "$12.00", change: "+600%", type: "banger" },
  { content: "exit liquidity lmao", price: "$0.05", change: "-88%", type: "rekt" },
  { content: "MYTH dropped a nuke 🌀", price: "$0.70", change: "-45%", type: "hot" },
  { content: "first ape = free NFT", price: "$4.20", change: "+169%", type: "banger" },
  { content: "wen moon ser", price: "$0.22", change: "+8%", type: "mid" },
];

function getAccent(type: string) {
  switch (type) {
    case "banger": return "border-volt/30 shadow-[0_0_12px_oklch(0.87_0.29_145/0.15)]";
    case "rekt": return "border-signal/30 shadow-[0_0_12px_oklch(0.65_0.25_25/0.15)]";
    case "hot": return "border-hyper/30 shadow-[0_0_12px_oklch(0.55_0.25_290/0.15)]";
    default: return "border-border/20";
  }
}

function getChangeColor(change: string) {
  return change.startsWith("+") ? "text-volt" : "text-signal";
}

export function FloatingPosts() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {POSTS.map((post, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const leftBase = col * 25 + 2 + (row % 2) * 8;
        const topBase = row * 25 + 5;
        const left = leftBase + Math.sin(i * 1.7) * 6;
        const top = topBase + Math.cos(i * 2.3) * 8;
        const rotation = (i % 2 === 0 ? 1 : -1) * (3 + (i % 7) * 1.5);
        const delay = i * 0.15;
        const duration = 18 + (i % 5) * 4;
        const floatY = (i % 2 === 0 ? -12 : 12);

        return (
          <motion.div
            key={i}
            className={`absolute w-36 sm:w-44 rounded-xl border bg-background/40 backdrop-blur-sm p-2.5 ${getAccent(post.type)}`}
            style={{
              left: `${left}%`,
              top: `${top}%`,
              rotate: `${rotation}deg`,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: [0, 0.35, 0.35, 0],
              scale: [0.85, 1, 1, 0.9],
              y: [0, floatY, -floatY, 0],
            }}
            transition={{
              duration,
              delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <p className="text-[10px] sm:text-xs font-medium text-foreground/80 leading-tight line-clamp-2">
              {post.content}
            </p>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[9px] font-mono text-muted-foreground">{post.price}</span>
              <span className={`text-[9px] font-bold ${getChangeColor(post.change)}`}>{post.change}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
