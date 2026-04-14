import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface TickerItem {
  id: number;
  label: string;
  price: number;
  change: number;
}

const INITIAL_ITEMS: TickerItem[] = [
  { id: 1, label: "Work is a scam", price: 4.20, change: 12.5 },
  { id: 2, label: "AI will replace you", price: 8.90, change: -6.3 },
  { id: 3, label: "Bitcoin to 500k", price: 15.30, change: 34.1 },
  { id: 4, label: "College is dead", price: 2.10, change: -18.7 },
  { id: 5, label: "Rent is theft", price: 6.60, change: 8.2 },
  { id: 6, label: "Hustle culture toxic", price: 3.40, change: -4.1 },
  { id: 7, label: "Remote > Office", price: 11.20, change: 22.9 },
  { id: 8, label: "Marriage is outdated", price: 1.80, change: -31.2 },
  { id: 9, label: "Sleep is underrated", price: 7.70, change: 5.6 },
  { id: 10, label: "Web3 is inevitable", price: 9.50, change: 15.3 },
];

export function MockTicker() {
  const [items, setItems] = useState(INITIAL_ITEMS);

  useEffect(() => {
    const interval = setInterval(() => {
      setItems(prev =>
        prev.map(item => {
          const delta = (Math.random() - 0.45) * 2;
          const newPrice = Math.max(0.1, item.price + item.price * delta * 0.02);
          const newChange = item.change + delta * 3;
          return { ...item, price: newPrice, change: newChange };
        })
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const doubled = [...items, ...items];

  return (
    <div className="w-full overflow-hidden border-y border-border/50 bg-surface/50 backdrop-blur-sm">
      <div className="animate-ticker-scroll flex whitespace-nowrap py-3">
        {doubled.map((item, i) => (
          <div key={`${item.id}-${i}`} className="mx-6 inline-flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground truncate max-w-[140px]">
              {item.label}
            </span>
            <span className="text-sm font-bold text-foreground tabular-nums">
              ${item.price.toFixed(2)}
            </span>
            <span
              className={`text-xs font-semibold tabular-nums ${
                item.change >= 0 ? "text-volt" : "text-signal"
              }`}
            >
              {item.change >= 0 ? "+" : ""}
              {item.change.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
