import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Panel, StatCard } from "@/components/StatCard";
import { usePropFirms, useTrades } from "@/lib/data";
import { fmtMoney, fmtNum, fmtPct, pnlClass } from "@/lib/format";
import { toISO } from "@/lib/stats";
import { PAIR_ADR } from "@/lib/types";

type Search = { account?: string };

export const Route = createFileRoute("/prop-firm-plan")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const account = search["account"];
    return typeof account === "string" ? { account } : {};
  },
  head: () => ({
    meta: [
      { title: "Challenge Plan — Ledger Trading Journal" },
      {
        name: "description",
        content:
          "Profit target, max drawdown and daily loss cap for a prop firm challenge, with a live drawdown tracker built from logged trades.",
      },
      { property: "og:title", content: "Challenge Plan — Ledger Trading Journal" },
    ],
  }),
  component: () => (
    <AppShell>
      <PlanBody />
    </AppShell>
  ),
});

const ADR_STEPS = [0.25, 0.33, 0.5, 0.75];

function PlanBody() {
  const { account: accountIdFromUrl } = Route.useSearch();
  const { data: accounts = [] } = usePropFirms();
  const { data: trades = [] } = useTrades();

  const [selected, setSelected] = useState(accountIdFromUrl ?? "");
  const account = accounts.find((a) => a.id === selected) ?? accounts[0];

  const size = account?.account_size ?? 0;
  const profitTarget = size * (account?.profit_target_pct ?? 0);
  const maxDrawdown = size * (account?.max_drawdown_pct ?? 0);
  const dailyLossCap = size * (account?.daily_loss_cap_pct ?? 0);
  const riskPerTrade = size * (account?.risk_per_trade_pct ?? 0);
  const losingTradesToDailyCap = riskPerTrade ? dailyLossCap / riskPerTrade : 0;
  const maxTheoreticalDailyLoss = riskPerTrade * (account?.max_trades_per_day ?? 0);
  const maxTheoreticalPctOfCap = dailyLossCap ? maxTheoreticalDailyLoss / dailyLossCap : 0;

  // Trades tied to this account, oldest first — real data replacing the
  // spreadsheet's manual day-by-day entry.
  const accountTrades = useMemo(
    () =>
      [...trades]
        .filter((t) => t.account_id === account?.id)
        .sort((a, b) =>
          a.date === b.date
            ? a.created_at.localeCompare(b.created_at)
            : a.date.localeCompare(b.date),
        ),
    [trades, account?.id],
  );

  const byDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of accountTrades) map.set(t.date, (map.get(t.date) ?? 0) + Number(t.pnl ?? 0));
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [accountTrades]);

  let cum = 0;
  const tracker = byDay.map(([date, dailyPnl]) => {
    cum += dailyPnl;
    const ddPct = cum >= 0 || !maxDrawdown ? 0 : Math.abs(cum) / maxDrawdown;
    const status = ddPct >= 1 ? "BREACHED" : ddPct >= 0.75 ? "CAUTION" : "OK";
    const dailyBreached = dailyLossCap ? dailyPnl <= -dailyLossCap : false;
    return { date, dailyPnl, cum, ddPct, status, dailyBreached };
  });

  const latest = tracker[tracker.length - 1];
  const progressPct = profitTarget ? Math.max(0, ((latest?.cum ?? 0) / profitTarget) * 100) : 0;

  if (!accounts.length) {
    return (
      <Panel title="Challenge Plan">
        <p className="text-sm text-muted-foreground">
          No prop firm accounts yet.{" "}
          <Link to="/" className="text-primary underline-offset-2 hover:underline">
            Add one on the Dashboard
          </Link>{" "}
          to set up a challenge plan.
        </p>
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      <Panel title="Challenge">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={account?.id ?? ""}
            onChange={(e) => setSelected(e.target.value)}
            className="num rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-sm outline-none focus:border-primary/60"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.firm} — {fmtMoney(a.account_size)} ({a.phase})
              </option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground">
            {accountTrades.length} trade{accountTrades.length === 1 ? "" : "s"} logged against this
            account.{" "}
            <Link to="/trades" className="text-primary underline-offset-2 hover:underline">
              Log one
            </Link>
          </span>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Profit target"
          value={fmtMoney(profitTarget)}
          tone={1}
          sub={fmtPct((account?.profit_target_pct ?? 0) * 100)}
        />
        <StatCard
          label="Max drawdown"
          value={fmtMoney(maxDrawdown)}
          tone={-1}
          sub={fmtPct((account?.max_drawdown_pct ?? 0) * 100)}
        />
        <StatCard
          label="Daily loss cap"
          value={fmtMoney(dailyLossCap)}
          tone={-1}
          sub={fmtPct((account?.daily_loss_cap_pct ?? 0) * 100)}
        />
        <StatCard
          label="Risk per trade"
          value={fmtMoney(riskPerTrade)}
          sub={fmtPct((account?.risk_per_trade_pct ?? 0) * 100)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard
          label="Losing trades to hit daily cap"
          value={losingTradesToDailyCap ? fmtNum(losingTradesToDailyCap, 1) : "—"}
        />
        <StatCard
          label={`Max theoretical daily loss (${account?.max_trades_per_day ?? 0} trades)`}
          value={fmtMoney(maxTheoreticalDailyLoss)}
          tone={-1}
          sub={`${fmtNum(maxTheoreticalPctOfCap * 100, 0)}% of daily cap`}
        />
        <StatCard
          label="Progress to target"
          value={latest ? fmtMoney(latest.cum) : fmtMoney(0)}
          {...(latest ? { tone: latest.cum } : {})}
          {...(profitTarget
            ? { sub: `${fmtNum(progressPct, 0)}% of ${fmtMoney(profitTarget)}` }
            : {})}
        />
      </div>

      {Object.entries(PAIR_ADR).map(([pair, { adrPips, pipValuePerLot }]) => (
        <Panel key={pair} title={`Stop-loss & lot size — ${pair}`}>
          <p className="mb-3 text-[11px] text-muted-foreground">
            ADR assumption: {adrPips} pips · {fmtMoney(pipValuePerLot)}/pip per standard lot — edit
            in code as volatility regimes shift.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">% of ADR</th>
                  <th className="py-2 pr-3">Stop loss (pips)</th>
                  <th className="py-2 pr-3">Standard lots</th>
                  <th className="py-2 pr-3">Mini lots</th>
                  <th className="py-2">Micro lots</th>
                </tr>
              </thead>
              <tbody className="num">
                {ADR_STEPS.map((pct) => {
                  const stopPips = Math.round(adrPips * pct);
                  const lots =
                    riskPerTrade && stopPips ? riskPerTrade / (stopPips * pipValuePerLot) : 0;
                  return (
                    <tr key={pct} className="border-t border-border">
                      <td className="py-2 pr-3 text-muted-foreground">{fmtPct(pct * 100)}</td>
                      <td className="py-2 pr-3">{stopPips}</td>
                      <td className="py-2 pr-3 text-primary">{fmtNum(lots, 2)}</td>
                      <td className="py-2 pr-3">{fmtNum(lots * 10, 2)}</td>
                      <td className="py-2">{fmtNum(lots * 100, 2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      ))}

      <Panel title="Cumulative drawdown tracker">
        {tracker.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Daily P/L</th>
                  <th className="py-2 pr-3">Cumulative P/L</th>
                  <th className="py-2 pr-3">Drawdown used</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="num">
                {tracker.map((row) => (
                  <tr key={row.date} className="border-t border-border">
                    <td className="py-2 pr-3 text-muted-foreground">{row.date}</td>
                    <td className={`py-2 pr-3 ${pnlClass(row.dailyPnl)}`}>
                      {fmtMoney(row.dailyPnl)}
                      {row.dailyBreached ? (
                        <span className="ml-1 rounded bg-loss/15 px-1 text-[10px] text-loss">
                          DAILY CAP HIT
                        </span>
                      ) : null}
                    </td>
                    <td className={`py-2 pr-3 ${pnlClass(row.cum)}`}>{fmtMoney(row.cum)}</td>
                    <td className="py-2 pr-3">{fmtPct(row.ddPct * 100)}</td>
                    <td
                      className={`py-2 font-medium ${
                        row.status === "BREACHED"
                          ? "text-loss"
                          : row.status === "CAUTION"
                            ? "text-amber-400"
                            : "text-profit"
                      }`}
                    >
                      {row.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No trades tagged to this account yet. Log trades on the{" "}
            <Link to="/trades" className="text-primary underline-offset-2 hover:underline">
              Trades page
            </Link>{" "}
            and pick this account from the dropdown to see it here.
          </p>
        )}
        <p className="mt-3 text-[11px] text-muted-foreground">
          Grouped by day from your logged trades since {account?.start_date ?? "account creation"}.
          Drawdown % = |cumulative loss| ÷ max drawdown $. CAUTION at 75%, BREACHED at 100%.
        </p>
      </Panel>

      <p className="text-[11px] text-muted-foreground">
        Reference date: {toISO(new Date())}. Position sizing and journaling only — not financial
        advice.
      </p>
    </div>
  );
}
