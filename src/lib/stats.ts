import type { Trade } from "./types";

export type Stats = {
  netPnl: number;
  winRate: number;
  count: number;
  avgR: number;
  profitFactor: number;
  expectancy: number;
  avgWin: number;
  avgLoss: number;
  bestTrade: number;
  worstTrade: number;
};

export function computeStats(trades: Trade[]): Stats {
  const n = trades.length;
  const pnls = trades.map((t) => Number(t.pnl ?? 0));
  const wins = pnls.filter((p) => p > 0);
  const losses = pnls.filter((p) => p < 0);
  const grossWin = wins.reduce((a, b) => a + b, 0);
  const grossLoss = Math.abs(losses.reduce((a, b) => a + b, 0));
  const netPnl = pnls.reduce((a, b) => a + b, 0);
  const rs = trades.map((t) => Number(t.r_multiple ?? 0)).filter((r) => !Number.isNaN(r));

  return {
    netPnl,
    count: n,
    winRate: n ? (wins.length / n) * 100 : 0,
    avgR: rs.length ? rs.reduce((a, b) => a + b, 0) / rs.length : 0,
    profitFactor: grossLoss ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0,
    expectancy: n ? netPnl / n : 0,
    avgWin: wins.length ? grossWin / wins.length : 0,
    avgLoss: losses.length ? -grossLoss / losses.length : 0,
    bestTrade: n ? Math.max(...pnls) : 0,
    worstTrade: n ? Math.min(...pnls) : 0,
  };
}

export function equityCurve(trades: Trade[]) {
  const sorted = [...trades].sort((a, b) =>
    a.date === b.date ? a.created_at.localeCompare(b.created_at) : a.date.localeCompare(b.date),
  );
  let cum = 0;
  return sorted.map((t, i) => {
    cum += Number(t.pnl ?? 0);
    return { i: i + 1, label: t.date, equity: Number(cum.toFixed(2)) };
  });
}

export function groupSum<T>(items: T[], key: (t: T) => string, value: (t: T) => number) {
  const map = new Map<string, number>();
  for (const it of items) map.set(key(it), (map.get(key(it)) ?? 0) + value(it));
  return map;
}

export const dayName = (dateStr: string) =>
  ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
    new Date(`${dateStr}T00:00:00`).getDay()
  ] ?? "";

export function weekRange(ref = new Date()) {
  const d = new Date(ref);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(d);
  monday.setDate(d.getDate() - day);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: toISO(monday), end: toISO(sunday), monday };
}

export const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function rBucket(r: number) {
  if (r < -1) return "<-1R";
  if (r < 0) return "-1R to 0R";
  if (r < 1) return "0R to 1R";
  if (r < 2) return "1R to 2R";
  if (r < 3) return "2R to 3R";
  return ">3R";
}

export const R_BUCKETS = ["<-1R", "-1R to 0R", "0R to 1R", "1R to 2R", "2R to 3R", ">3R"];
