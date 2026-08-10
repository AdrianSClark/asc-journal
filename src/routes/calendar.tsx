import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Panel } from "@/components/StatCard";
import { useDeleteNews, useNews, useSaveNews, useSyncNews, useTrades } from "@/lib/data";
import { toISO, weekRange } from "@/lib/stats";
import { fmtMoney, pnlClass } from "@/lib/format";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Economic Calendar — Ledger Trading Journal" },
      {
        name: "description",
        content:
          "Month and week P&L calendar plus a ForexFactory-style economic calendar with live actual, forecast and previous values.",
      },
      { property: "og:title", content: "Economic Calendar — Ledger Trading Journal" },
      {
        property: "og:description",
        content: "P&L calendar with a live economic calendar table, currency and impact filters.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <CalendarBody />
    </AppShell>
  ),
});

const inputCls =
  "num w-full rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-xs outline-none focus:border-primary/60";

const IMPACT_DOT: Record<string, string> = {
  high: "bg-loss",
  medium: "bg-primary",
  low: "bg-muted-foreground",
};

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "NZD", "CNY"];
const IMPACTS = ["high", "medium", "low"];

function CalendarBody() {
  const { data: trades = [] } = useTrades();
  const { data: news = [] } = useNews();
  const saveNews = useSaveNews();
  const delNews = useDeleteNews();
  const sync = useSyncNews();

  const [view, setView] = useState<"month" | "week">("month");
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [curOn, setCurOn] = useState<string[]>(CURRENCIES);
  const [impOn, setImpOn] = useState<string[]>(IMPACTS);
  const [form, setForm] = useState({
    date: toISO(new Date()),
    time: "",
    currency: "USD",
    impact: "high",
    title: "",
    forecast: "",
    previous: "",
    actual: "",
  });

  const pnlByDay = new Map<string, number>();
  const countByDay = new Map<string, number>();
  for (const t of trades) {
    pnlByDay.set(t.date, (pnlByDay.get(t.date) ?? 0) + Number(t.pnl ?? 0));
    countByDay.set(t.date, (countByDay.get(t.date) ?? 0) + 1);
  }

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => toISO(new Date(year, month, i + 1))),
  ];

  const { monday } = weekRange(cursor);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toISO(d);
  });

  const dayTrades = selected ? trades.filter((t) => t.date === selected) : [];
  const today = toISO(new Date());

  const tableNews = news
    .filter((n) => (selected ? n.date === selected : n.date >= today))
    .filter((n) => impOn.includes((n.impact ?? "low").toLowerCase()))
    .filter((n) => !n.currency || curOn.includes(n.currency.toUpperCase()));

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <div className="space-y-4">
          <Panel
            title={
              view === "month"
                ? cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })
                : `Week of ${weekDays[0]}`
            }
            right={
              <div className="flex items-center gap-2">
                <div className="flex rounded-md border border-border p-0.5">
                  {(["month", "week"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className={`rounded px-2.5 py-1 text-[11px] capitalize ${
                        view === v ? "bg-primary/15 text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {v} view
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    const d = new Date(cursor);
                    view === "month" ? d.setMonth(d.getMonth() - 1) : d.setDate(d.getDate() - 7);
                    setCursor(d);
                  }}
                  className="rounded-md border border-border px-2 py-1 text-[11px]"
                >
                  ‹
                </button>
                <button
                  onClick={() => {
                    const d = new Date(cursor);
                    view === "month" ? d.setMonth(d.getMonth() + 1) : d.setDate(d.getDate() + 7);
                    setCursor(d);
                  }}
                  className="rounded-md border border-border px-2 py-1 text-[11px]"
                >
                  ›
                </button>
              </div>
            }
          >
            {view === "month" ? (
              <div className="grid grid-cols-7 gap-1">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div
                    key={d}
                    className="pb-1 text-center text-[10px] uppercase tracking-widest text-muted-foreground"
                  >
                    {d}
                  </div>
                ))}
                {cells.map((iso, i) => {
                  if (!iso) return <div key={`e${i}`} />;
                  const pnl = pnlByDay.get(iso);
                  const bg =
                    pnl === undefined
                      ? "bg-surface-2/40"
                      : pnl >= 0
                        ? "bg-profit/15 border-profit/40"
                        : "bg-loss/15 border-loss/40";
                  return (
                    <button
                      key={iso}
                      onClick={() => setSelected(iso === selected ? null : iso)}
                      className={`min-h-[62px] rounded-md border border-border p-1.5 text-left ${bg} ${
                        selected === iso ? "ring-1 ring-primary" : ""
                      }`}
                    >
                      <div className="num text-[10px] text-muted-foreground">
                        {Number(iso.slice(-2))}
                      </div>
                      {pnl !== undefined ? (
                        <div className={`num mt-1 text-[11px] ${pnlClass(pnl)}`}>
                          {fmtMoney(pnl)}
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 md:grid-cols-7">
                {weekDays.map((iso) => {
                  const pnl = pnlByDay.get(iso) ?? 0;
                  const evts = news.filter((n) => n.date === iso);
                  return (
                    <button
                      key={iso}
                      onClick={() => setSelected(iso === selected ? null : iso)}
                      className={`min-h-[120px] rounded-md border border-border bg-surface-2/40 p-2 text-left ${
                        selected === iso ? "ring-1 ring-primary" : ""
                      }`}
                    >
                      <div className="num text-[10px] text-muted-foreground">{iso}</div>
                      <div className={`num mt-1 text-sm ${pnlClass(pnl)}`}>{fmtMoney(pnl)}</div>
                      <div className="num text-[10px] text-muted-foreground">
                        {countByDay.get(iso) ?? 0} trades
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {evts.slice(0, 4).map((e) => (
                          <div key={e.id} className="flex items-center gap-1 text-[10px]">
                            <span
                              className={`size-1.5 rounded-full ${IMPACT_DOT[e.impact] ?? "bg-muted"}`}
                            />
                            <span className="truncate">{e.title}</span>
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Panel>

          {selected ? (
            <Panel title={`Trades on ${selected}`}>
              {dayTrades.length ? (
                <table className="w-full text-left text-xs">
                  <tbody>
                    {dayTrades.map((t) => (
                      <tr key={t.id} className="border-b border-border/60">
                        <td className="num px-2 py-2">{t.symbol}</td>
                        <td className="px-2 py-2 uppercase text-muted-foreground">{t.direction}</td>
                        <td className={`num px-2 py-2 ${pnlClass(Number(t.pnl))}`}>
                          {fmtMoney(t.pnl)}
                        </td>
                        <td className="px-2 py-2 text-muted-foreground">{t.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-xs text-muted-foreground">No trades logged on this day.</p>
              )}
            </Panel>
          ) : null}
        </div>

        <Panel title="Filters">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Currency</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {CURRENCIES.map((c) => (
              <button
                key={c}
                onClick={() => toggle(curOn, setCurOn, c)}
                className={`num rounded-md border px-2 py-1 text-[11px] ${
                  curOn.includes(c)
                    ? "border-primary/60 bg-primary/15 text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mt-4 text-[10px] uppercase tracking-widest text-muted-foreground">
            Impact
          </div>
          <div className="mt-2 space-y-1.5">
            {IMPACTS.map((i) => (
              <label key={i} className="flex items-center gap-2 text-xs capitalize">
                <input
                  type="checkbox"
                  checked={impOn.includes(i)}
                  onChange={() => toggle(impOn, setImpOn, i)}
                  className="accent-[var(--primary)]"
                />
                <span className={`size-2.5 rounded-sm ${IMPACT_DOT[i]}`} />
                {i}
              </label>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            <button
              onClick={() => sync.mutate()}
              disabled={sync.isPending}
              className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
            >
              <RefreshCw className={`size-3.5 ${sync.isPending ? "animate-spin" : ""}`} />
              {sync.isPending ? "Syncing…" : "Sync live calendar"}
            </button>
            <button
              onClick={() => setShowForm((s) => !s)}
              className="flex w-full items-center justify-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground"
            >
              <Plus className="size-3.5" /> Add event manually
            </button>
            {selected ? (
              <button
                onClick={() => setSelected(null)}
                className="w-full rounded-md border border-border px-3 py-1.5 text-[11px] text-muted-foreground"
              >
                Clear day filter ({selected})
              </button>
            ) : null}
          </div>
        </Panel>
      </div>

      {showForm ? (
        <Panel title="Add event">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveNews.mutate({
                ...form,
                time: form.time || null,
                forecast: form.forecast || null,
                previous: form.previous || null,
                actual: form.actual || null,
                source: "manual",
              });
              setForm({ ...form, title: "", forecast: "", previous: "", actual: "" });
              setShowForm(false);
            }}
            className="grid gap-2 md:grid-cols-4"
          >
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className={inputCls}
            />
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              className={inputCls}
            />
            <input
              placeholder="Currency"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
              className={inputCls}
            />
            <select
              value={form.impact}
              onChange={(e) => setForm({ ...form, impact: e.target.value })}
              className={inputCls}
            >
              <option value="high">High impact</option>
              <option value="medium">Medium impact</option>
              <option value="low">Low impact</option>
            </select>
            <input
              required
              placeholder="Event title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={`${inputCls} md:col-span-4`}
            />
            <input
              placeholder="Forecast"
              value={form.forecast}
              onChange={(e) => setForm({ ...form, forecast: e.target.value })}
              className={inputCls}
            />
            <input
              placeholder="Previous"
              value={form.previous}
              onChange={(e) => setForm({ ...form, previous: e.target.value })}
              className={inputCls}
            />
            <input
              placeholder="Actual"
              value={form.actual}
              onChange={(e) => setForm({ ...form, actual: e.target.value })}
              className={inputCls}
            />
            <button className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
              Add event
            </button>
          </form>
        </Panel>
      ) : null}

      <Panel
        title={selected ? `Economic calendar — ${selected}` : "Economic calendar — upcoming"}
        right={
          <span className="num text-[10px] text-muted-foreground">
            {sync.data && "inserted" in (sync.data as object)
              ? `${(sync.data as { inserted: number }).inserted} events synced`
              : `${tableNews.length} events`}
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Time</th>
                <th className="px-2 py-2">Currency</th>
                <th className="px-2 py-2">Impact</th>
                <th className="px-2 py-2">Event</th>
                <th className="px-2 py-2 text-right">Actual</th>
                <th className="px-2 py-2 text-right">Forecast</th>
                <th className="px-2 py-2 text-right">Previous</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {tableNews.map((n) => (
                <tr key={n.id} className="border-b border-border/60">
                  <td className="num px-2 py-2 text-muted-foreground">{n.date}</td>
                  <td className="num px-2 py-2 text-muted-foreground">{n.time ?? "—"}</td>
                  <td className="num px-2 py-2">{n.currency ?? "—"}</td>
                  <td className="px-2 py-2">
                    <span className="flex items-center gap-1.5 capitalize">
                      <span
                        className={`size-2.5 rounded-sm ${IMPACT_DOT[n.impact?.toLowerCase()] ?? "bg-muted"}`}
                      />
                      {n.impact}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    <span className="flex items-center gap-2">
                      {n.title}
                      <span
                        className={`rounded border px-1 py-0.5 text-[9px] uppercase tracking-wide ${
                          n.source === "synced"
                            ? "border-primary/40 text-primary"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {n.source === "synced" ? "live" : "manual"}
                      </span>
                    </span>
                  </td>
                  <td className="num px-2 py-2 text-right">{n.actual ?? "—"}</td>
                  <td className="num px-2 py-2 text-right text-muted-foreground">
                    {n.forecast ?? "—"}
                  </td>
                  <td className="num px-2 py-2 text-right text-muted-foreground">
                    {n.previous ?? "—"}
                  </td>
                  <td className="px-2 py-2 text-right">
                    <button onClick={() => delNews.mutate(n.id)} className="text-loss">
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!tableNews.length ? (
          <p className="mt-3 text-xs text-muted-foreground">
            No events match the current filters. Hit “Sync live calendar” to pull this week and next
            week from the live feed, or add an event manually.
          </p>
        ) : null}
      </Panel>
    </div>
  );
}
