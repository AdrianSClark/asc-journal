import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { StatCard, Panel } from "@/components/StatCard";
import { EquityCurve } from "@/components/EquityCurve";
import { Collapsible, TradingPlanEditor } from "@/components/TradingPlan";
import { PropFirmAccounts } from "@/components/PropFirms";
import { useNews, useTrades } from "@/lib/data";
import { computeStats, weekRange } from "@/lib/stats";
import { fmtMoney, fmtNum, fmtPct } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Ledger Trading Journal" },
      {
        name: "description",
        content:
          "Live P&L, win rate, equity curve, weekly news outlook and your personal trading plan in one terminal-style dashboard.",
      },
      { property: "og:title", content: "Dashboard — Ledger Trading Journal" },
      {
        property: "og:description",
        content: "Live P&L, win rate, equity curve and your personal trading plan.",
      },
    ],
  }),
  component: Dashboard,
});

const IMPACT_DOT: Record<string, string> = {
  high: "bg-loss",
  medium: "bg-primary",
  low: "bg-muted-foreground",
};

function Dashboard() {
  return (
    <AppShell>
      <DashboardBody />
    </AppShell>
  );
}

function DashboardBody() {
  const { data: trades = [] } = useTrades();
  const { data: news = [] } = useNews();
  const s = computeStats(trades);
  const { start, end } = weekRange();
  const weekNews = news.filter((n) => n.date >= start && n.date <= end);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <StatCard label="Net P&L" value={fmtMoney(s.netPnl)} tone={s.netPnl} />
        <StatCard label="Win Rate" value={fmtPct(s.winRate)} />
        <StatCard label="Trades" value={s.count} />
        <StatCard label="Avg R" value={`${fmtNum(s.avgR)}R`} tone={s.avgR} />
        <StatCard
          label="Profit Factor"
          value={Number.isFinite(s.profitFactor) ? fmtNum(s.profitFactor) : "∞"}
        />
        <StatCard label="Expectancy" value={fmtMoney(s.expectancy)} tone={s.expectancy} />
      </div>

      <Panel title="Equity curve">
        <EquityCurve trades={trades} />
      </Panel>

      <Collapsible title="Weekly news outlook">
        <div className="space-y-2">
          {weekNews.length ? (
            weekNews.map((n) => (
              <div key={n.id} className="flex items-center gap-3 text-xs">
                <span className={`size-2 rounded-full ${IMPACT_DOT[n.impact] ?? "bg-muted"}`} />
                <span className="num w-24 text-muted-foreground">{n.date}</span>
                <span className="num w-14 text-muted-foreground">{n.time ?? "--:--"}</span>
                <span className="num w-12 text-primary">{n.currency}</span>
                <span>{n.title}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">
              No events logged for {start} – {end}. Add them on the Calendar tab.
            </p>
          )}
        </div>
      </Collapsible>

      <Collapsible title="Personal trading plan" defaultOpen>
        <TradingPlanEditor />
      </Collapsible>

      <Collapsible title="Prop firm accounts">
        <PropFirmAccounts />
      </Collapsible>
    </>
  );
}
