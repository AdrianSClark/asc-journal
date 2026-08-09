import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { equityCurve } from "@/lib/stats";
import { fmtMoney } from "@/lib/format";
import type { Trade } from "@/lib/types";

export function EquityCurve({ trades, height = 260 }: { trades: Trade[]; height?: number }) {
  const data = equityCurve(trades);
  if (!data.length) {
    return (
      <div className="num flex h-40 items-center justify-center text-xs text-muted-foreground">
        No closed trades yet
      </div>
    );
  }
  const up = (data[data.length - 1]?.equity ?? 0) >= 0;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "var(--muted-foreground)", fontSize: 10, fontFamily: "var(--font-mono)" }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis
          tick={{ fill: "var(--muted-foreground)", fontSize: 10, fontFamily: "var(--font-mono)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontFamily: "var(--font-mono)",
            fontSize: 12,
          }}
          labelStyle={{ color: "var(--muted-foreground)" }}
          formatter={(v: number) => [fmtMoney(v), "Equity"]}
        />
        <Line
          type="monotone"
          dataKey="equity"
          stroke={up ? "var(--profit)" : "var(--loss)"}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
