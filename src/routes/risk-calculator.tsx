import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Panel, StatCard } from "@/components/StatCard";
import { useAccountSettings, useSaveBalance } from "@/lib/data";
import { fmtMoney, fmtNum } from "@/lib/format";

export const Route = createFileRoute("/risk-calculator")({
  head: () => ({
    meta: [
      { title: "Risk Calculator — Ledger Trading Journal" },
      {
        name: "description",
        content:
          "Work out risk in dollars, stop distance, reward:risk and max position size from your account balance and risk percentage.",
      },
      { property: "og:title", content: "Risk Calculator — Ledger Trading Journal" },
      {
        property: "og:description",
        content: "Risk in dollars, stop distance, reward:risk and max position size.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <RiskBody />
    </AppShell>
  ),
});

const inputCls =
  "num w-full rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-sm outline-none focus:border-primary/60";

function RiskBody() {
  const { data: settings } = useAccountSettings();
  const saveBalance = useSaveBalance();
  const [balance, setBalance] = useState("10000");
  const [risk, setRisk] = useState(1);
  const [direction, setDirection] = useState("long");
  const [entry, setEntry] = useState("");
  const [stop, setStop] = useState("");
  const [tp, setTp] = useState("");

  useEffect(() => {
    if (settings) setBalance(String(settings.account_balance));
  }, [settings]);

  const bal = Number(balance || 0);
  const e = Number(entry || 0);
  const s = Number(stop || 0);
  const t = Number(tp || 0);
  const riskAmount = (bal * risk) / 100;
  const stopDistance = Math.abs(e - s);
  const size = stopDistance ? riskAmount / stopDistance : 0;
  const rewardDistance = t ? Math.abs(t - e) : 0;
  const rr = stopDistance && rewardDistance ? rewardDistance / stopDistance : 0;
  const reward = rewardDistance ? size * rewardDistance : 0;

  const wrongSide =
    e > 0 && s > 0 && ((direction === "long" && s >= e) || (direction === "short" && s <= e));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Inputs">
        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Account balance
            </label>
            <input
              type="number"
              value={balance}
              onChange={(ev) => setBalance(ev.target.value)}
              onBlur={() => saveBalance.mutate(Number(balance || 0))}
              className={`${inputCls} mt-1`}
            />
          </div>
          <div>
            <label className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
              Risk per trade <span className="num text-primary">{risk.toFixed(1)}%</span>
            </label>
            <input
              type="range"
              min={0.1}
              max={10}
              step={0.1}
              value={risk}
              onChange={(ev) => setRisk(Number(ev.target.value))}
              className="mt-2 w-full accent-[var(--primary)]"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Direction
            </label>
            <div className="mt-1 flex gap-2">
              {["long", "short"].map((d) => (
                <button
                  key={d}
                  onClick={() => setDirection(d)}
                  className={`flex-1 rounded-md border px-3 py-1.5 text-xs uppercase ${
                    direction === d
                      ? "border-primary/60 bg-primary/15 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              ["Entry", entry, setEntry],
              ["Stop loss", stop, setStop],
              ["Take profit", tp, setTp],
            ].map(([label, val, setter]) => (
              <div key={label as string}>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {label as string}
                </label>
                <input
                  type="number"
                  step="any"
                  value={val as string}
                  onChange={(ev) => (setter as (v: string) => void)(ev.target.value)}
                  className={`${inputCls} mt-1`}
                />
              </div>
            ))}
          </div>
          {wrongSide ? (
            <p className="rounded-md border border-loss/50 bg-loss/10 px-3 py-2 text-xs text-loss">
              Stop is on the wrong side of entry for a {direction} position.
            </p>
          ) : null}
        </div>
      </Panel>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Risk amount" value={fmtMoney(riskAmount)} tone={-1} />
          <StatCard label="Stop distance" value={fmtNum(stopDistance, 5)} />
          <StatCard label="Reward : Risk" value={rr ? `${fmtNum(rr)} : 1` : "—"} />
          <StatCard label="Potential reward" value={fmtMoney(reward)} tone={1} />
        </div>
        <Panel title="Max position size">
          <div className="num text-3xl text-primary">
            {size ? size.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—"}
          </div>
          <p className="num mt-1 text-[11px] text-muted-foreground">
            units = (balance × risk%) ÷ |entry − stop|
          </p>
        </Panel>
        <p className="text-[11px] text-muted-foreground">
          For position sizing and journaling only — not financial advice.
        </p>
      </div>
    </div>
  );
}
