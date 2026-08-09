import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Panel, StatCard } from "@/components/StatCard";
import { useDeleteGoal, useGoals, useSaveGoal, useTrades } from "@/lib/data";
import { toISO, weekRange } from "@/lib/stats";
import { fmtMoney, fmtNum } from "@/lib/format";

export const Route = createFileRoute("/weekly-goals")({
  head: () => ({
    meta: [
      { title: "Weekly Goals — Ledger Trading Journal" },
      {
        name: "description",
        content:
          "Set weekly targets for profit, trade count, win rate or R gained and track progress automatically from your trade log.",
      },
      { property: "og:title", content: "Weekly Goals — Ledger Trading Journal" },
      {
        property: "og:description",
        content: "Weekly targets for profit, trades, win rate and R, tracked automatically.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <GoalsBody />
    </AppShell>
  ),
});

const inputCls =
  "num w-full rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-xs outline-none focus:border-primary/60";

const TRACKING = [
  { value: "profit", label: "Profit ($)", unit: "$" },
  { value: "trades", label: "Trades taken", unit: "trades" },
  { value: "winrate", label: "Win rate (%)", unit: "%" },
  { value: "r", label: "R gained", unit: "R" },
  { value: "manual", label: "Manual", unit: "" },
];

function GoalsBody() {
  const { data: goals = [] } = useGoals();
  const { data: trades = [] } = useTrades();
  const saveGoal = useSaveGoal();
  const delGoal = useDeleteGoal();
  const [form, setForm] = useState({ title: "", tracking_type: "profit", target: "", deadline: "" });

  const { monday, sunday } = weekRange();
  const from = toISO(monday);
  const to = toISO(sunday);
  const week = trades.filter((t) => t.date >= from && t.date <= to);
  const wins = week.filter((t) => Number(t.pnl) > 0).length;

  const autoValue = (type: string, manual: number) => {
    if (type === "profit") return week.reduce((a, t) => a + Number(t.pnl ?? 0), 0);
    if (type === "trades") return week.length;
    if (type === "winrate") return week.length ? (wins / week.length) * 100 : 0;
    if (type === "r") return week.reduce((a, t) => a + Number(t.r_multiple ?? 0), 0);
    return manual;
  };

  const fmtVal = (type: string, v: number) =>
    type === "profit" ? fmtMoney(v) : type === "winrate" ? `${fmtNum(v, 1)}%` : fmtNum(v, 2);

  const completed = goals.filter(
    (g) => autoValue(g.tracking_type, Number(g.current)) >= Number(g.target),
  ).length;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Week" value={`${from.slice(5)} → ${to.slice(5)}`} />
        <StatCard label="Active goals" value={String(goals.length)} />
        <StatCard label="Completed" value={String(completed)} tone={completed ? 1 : 0} />
        <StatCard
          label="Week P&L"
          value={fmtMoney(week.reduce((a, t) => a + Number(t.pnl ?? 0), 0))}
          tone={week.reduce((a, t) => a + Number(t.pnl ?? 0), 0)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Panel title="Goals">
          <div className="space-y-4">
            {goals.map((g) => {
              const value = autoValue(g.tracking_type, Number(g.current));
              const pct = Number(g.target)
                ? Math.min(100, Math.max(0, (value / Number(g.target)) * 100))
                : 0;
              const done = pct >= 100;
              return (
                <div key={g.id} className="rounded-md border border-border bg-surface-2/40 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm">{g.title}</div>
                      <div className="num text-[10px] uppercase tracking-widest text-muted-foreground">
                        {g.tracking_type}
                        {g.deadline ? ` · due ${g.deadline}` : ""}
                      </div>
                    </div>
                    <button onClick={() => delGoal.mutate(g.id)} className="text-loss">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
                    <div
                      className={`h-full rounded-full ${done ? "bg-profit" : "bg-primary"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="num mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>
                      {fmtVal(g.tracking_type, value)} / {fmtVal(g.tracking_type, Number(g.target))}
                    </span>
                    <span className={done ? "text-profit" : "text-primary"}>
                      {fmtNum(pct, 0)}%
                    </span>
                  </div>
                  {g.tracking_type === "manual" ? (
                    <input
                      type="number"
                      defaultValue={g.current}
                      onBlur={(e) =>
                        saveGoal.mutate({ id: g.id, current: Number(e.target.value || 0) })
                      }
                      className={`${inputCls} mt-2`}
                    />
                  ) : null}
                </div>
              );
            })}
            {!goals.length ? (
              <p className="text-xs text-muted-foreground">
                No goals yet — add your first weekly target.
              </p>
            ) : null}
          </div>
        </Panel>

        <Panel title="New goal">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const unit = TRACKING.find((t) => t.value === form.tracking_type)?.unit ?? "";
              saveGoal.mutate({
                title: form.title,
                tracking_type: form.tracking_type,
                target: Number(form.target || 0),
                current: 0,
                unit,
                deadline: form.deadline || null,
              });
              setForm({ title: "", tracking_type: "profit", target: "", deadline: "" });
            }}
            className="space-y-2"
          >
            <input
              required
              placeholder="Goal title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputCls}
            />
            <select
              value={form.tracking_type}
              onChange={(e) => setForm({ ...form, tracking_type: e.target.value })}
              className={inputCls}
            >
              {TRACKING.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <input
              required
              type="number"
              step="any"
              placeholder="Target"
              value={form.target}
              onChange={(e) => setForm({ ...form, target: e.target.value })}
              className={inputCls}
            />
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className={inputCls}
            />
            <button className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
              Add goal
            </button>
          </form>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Profit, trades, win rate and R goals update automatically from trades logged this week.
          </p>
        </Panel>
      </div>
    </>
  );
}
