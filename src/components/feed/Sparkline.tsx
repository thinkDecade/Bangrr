import { LineChart, Line, ResponsiveContainer } from "recharts";

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export function Sparkline({ data, color = "var(--volt)", height = 32 }: SparklineProps) {
  const chartData = data.map((price, i) => ({ i, price }));
  const isUp = data.length >= 2 && data[data.length - 1] >= data[0];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="price"
          stroke={color || (isUp ? "var(--volt)" : "var(--signal)")}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
