import { fmtMoney, fmtNum, fmtPct } from "@/lib/format";
import type { Stats } from "@/lib/stats";

export function Ticker({ stats, balance }: { stats: Stats; balance: number }) {
  const items = [
    ["ACCOUNT BALANCE", fmtMoney(balance + stats.netPnl)],
    ["NET P&L", fmtMoney(stats.netPnl)],
    ["WIN RATE", fmtPct(stats.winRate)],
    ["TRADES", String(stats.count)],
    ["AVG R", `${fmtNum(stats.avgR)}R`],
    [
      "PROFIT FACTOR",
      Number.isFinite(stats.profitFactor) ? fmtNum(stats.profitFactor) : "∞",
    ],
    ["BEST TRADE", fmtMoney(stats.bestTrade)],
    ["WORST TRADE", fmtMoney(stats.worstTrade)],
  ];
  const tone = stats.netPnl >= 0 ? "text-profit" : "text-loss";

  return (
    <div className="overflow-hidden border-b border-border bg-surface-2/60">
      <div className="flex w-max animate-ticker">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex shrink-0" aria-hidden={dup === 1}>
            {items.map(([label, value]) => (
              <div
                key={label}
                className="flex items-center gap-2 whitespace-nowrap px-5 py-1.5 text-[11px]"
              >
                <span className="tracking-widest text-muted-foreground">{label}</span>
                <span className={`num ${tone}`}>{value}</span>
                <span className="text-border">|</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
