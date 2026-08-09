import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { Panel, StatCard } from "@/components/StatCard";
import { EquityCurve } from "@/components/EquityCurve";
import { useTrades } from "@/lib/data";
import { R_BUCKETS, computeStats, dayName, groupSum, rBucket } from "@/lib/stats";
import { fmtMoney } from "@/lib/format";
import { DAYS } from "@/lib/types";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Ledger Trading Journal" },
      {
        name: "description",
        content:
          "Expectancy, P&L by symbol and weekday, win/loss split and R-multiple distribution computed from your trade log.",
      },
      { property: "og:title", content: "Analytics — Ledger Trading Journal" },
      {
        property: "og:description",
        content: "Expectancy, P&L by symbol and weekday, and R-multiple distribution.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <AnalyticsBody />
    </AppShell>
  ),
});

const axis = {
  tick: { fill: "var(--muted-foreground)", fontSize: 10, fontFamily: "var(--font-mono)" },
  axisLine: { stroke: "var(--border)" },
  tickLine: false,
} as const;

const tooltipStyle = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontFamily: "var(--font-mono)",
  fontSize: 12,
};

function AnalyticsBody() {
  const { data: trades = [] } = useTrades();
  const s = computeStats(trades);

  if (!trades.length) {
    return (
      <Panel title="Analytics">
        <p className="text-xs text-muted-foreground">
          No closed trades yet — log a trade to unlock analytics.
        </p>
      </Panel>
    );
  }

  const bySymbolMap = groupSum(
    trades,
    (t) => t.symbol,
    (t) => Number(t.pnl ?? 0),
  );
  const bySymbol = [...bySymbolMap.entries()].map(([symbol, pnl]) => ({ symbol, pnl }));
  const sortedSym = [...bySymbol].sort((a, b) => b.pnl - a.pnl);
  const byDayMap = groupSum(
    trades,
    (t) => dayName(t.date),
    (t) => Number(t.pnl ?? 0),
  );
  const byDay = DAYS.map((d) => ({ day: d.slice(0, 3), pnl: byDayMap.get(d) ?? 0 }));
  const wins = trades.filter((t) => Number(t.pnl) > 0).length;
  const split = [
    { name: "Wins", value: wins },
    { name: "Losses", value: trades.length - wins },
  ];
  const buckets = R_BUCKETS.map((b) => ({
    bucket: b,
    count: trades.filter((t) => t.r_multiple !== null && rBucket(Number(t.r_multiple)) === b).length,
  }));

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Expectancy / trade" value={fmtMoney(s.expectancy)} tone={s.expectancy} />
        <StatCard label="Avg win" value={fmtMoney(s.avgWin)} tone={1} />
        <StatCard label="Avg loss" value={fmtMoney(s.avgLoss)} tone={-1} />
        <StatCard
          label="Best symbol"
          value={sortedSym[0]?.symbol ?? "—"}
          sub={fmtMoney(sortedSym[0]?.pnl ?? 0)}
        />
        <StatCard
          label="Worst symbol"
          value={sortedSym[sortedSym.length - 1]?.symbol ?? "—"}
          sub={fmtMoney(sortedSym[sortedSym.length - 1]?.pnl ?? 0)}
        />
      </div>

      <Panel title="Equity curve">
        <EquityCurve trades={trades} height={320} />
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="P&L by symbol">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={bySymbol} margin={{ left: -16 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="symbol" {...axis} />
              <YAxis {...axis} axisLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: "var(--accent)", opacity: 0.3 }}
                formatter={(v: number) => [fmtMoney(v), "P&L"]}
              />
              <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                {bySymbol.map((d) => (
                  <Cell key={d.symbol} fill={d.pnl >= 0 ? "var(--profit)" : "var(--loss)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="P&L by day of week">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byDay} margin={{ left: -16 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="day" {...axis} />
              <YAxis {...axis} axisLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: "var(--accent)", opacity: 0.3 }}
                formatter={(v: number) => [fmtMoney(v), "P&L"]}
              />
              <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                {byDay.map((d) => (
                  <Cell key={d.day} fill={d.pnl >= 0 ? "var(--profit)" : "var(--loss)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Win / loss split">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={split} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                <Cell fill="var(--profit)" />
                <Cell fill="var(--loss)" />
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="R-multiple distribution">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={buckets} margin={{ left: -16 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="bucket" {...axis} interval={0} angle={-20} height={50} dy={10} />
              <YAxis {...axis} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--accent)", opacity: 0.3 }} />
              <Bar dataKey="count" fill="var(--primary)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </>
  );
}
