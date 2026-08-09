import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Panel } from "@/components/StatCard";
import { useDeleteNews, useNews, useSaveNews, useTrades } from "@/lib/data";
import { toISO, weekRange } from "@/lib/stats";
import { fmtMoney, pnlClass } from "@/lib/format";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — Ledger Trading Journal" },
      {
        name: "description",
        content:
          "Month and week P&L calendar with your manually maintained economic news events per day.",
      },
      { property: "og:title", content: "Calendar — Ledger Trading Journal" },
      {
        property: "og:description",
        content: "Month and week P&L calendar with your economic news events.",
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

function CalendarBody() {
  const { data: trades = [] } = useTrades();
  const { data: news = [] } = useNews();
  const saveNews = useSaveNews();
  const delNews = useDeleteNews();

  const [view, setView] = useState<"month" | "week">("month");
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: toISO(new Date()),
    time: "",
    currency: "USD",
    impact: "high",
    title: "",
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
  const panelNews = selected
    ? news.filter((n) => n.date === selected)
    : news.filter((n) => n.date >= today).slice(0, 8);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
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
                      <div className={`num mt-1 text-[11px] ${pnlClass(pnl)}`}>{fmtMoney(pnl)}</div>
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
                      {evts.map((e) => (
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

      <Panel title="Economic news">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveNews.mutate({ ...form, time: form.time || null });
            setForm({ ...form, title: "" });
          }}
          className="space-y-2"
        >
          <div className="grid grid-cols-2 gap-2">
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
          </div>
          <input
            required
            placeholder="Event title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={inputCls}
          />
          <button className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
            Add event
          </button>
        </form>

        <div className="mt-4 space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {selected ? `Events on ${selected}` : "Upcoming"}
          </div>
          {panelNews.map((n) => (
            <div key={n.id} className="flex items-start gap-2 text-xs">
              <span
                className={`mt-1.5 size-2 shrink-0 rounded-full ${IMPACT_DOT[n.impact] ?? "bg-muted"}`}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate">{n.title}</div>
                <div className="num text-[10px] text-muted-foreground">
                  {n.date} {n.time ?? ""} · {n.currency}
                </div>
              </div>
              <button onClick={() => delNews.mutate(n.id)} className="text-loss">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
          {!panelNews.length ? (
            <p className="text-xs text-muted-foreground">No events. There is no live feed — add
              the releases you care about above.</p>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
