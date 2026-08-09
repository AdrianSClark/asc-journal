import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Panel, StatCard } from "@/components/StatCard";
import { useDeleteTrade, useSaveTrade, useTrades } from "@/lib/data";
import { computeStats } from "@/lib/stats";
import { fmtMoney, fmtNum, fmtPct, pnlClass } from "@/lib/format";
import { toISO } from "@/lib/stats";

export const Route = createFileRoute("/trades")({
  head: () => ({
    meta: [
      { title: "Trades — Ledger Trading Journal" },
      {
        name: "description",
        content: "Log forex trades with entry, exit, size, P&L and R multiple, then edit or delete any row.",
      },
      { property: "og:title", content: "Trades — Ledger Trading Journal" },
      {
        property: "og:description",
        content: "Log forex trades with entry, exit, size, P&L and R multiple.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <TradesBody />
    </AppShell>
  ),
});

const inputCls =
  "num w-full rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-xs outline-none focus:border-primary/60";

const blank = {
  id: undefined as string | undefined,
  symbol: "",
  direction: "long",
  date: toISO(new Date()),
  entry_price: "",
  exit_price: "",
  size: "",
  pnl: "",
  r_multiple: "",
  notes: "",
};

function TradesBody() {
  const { data: trades = [] } = useTrades();
  const save = useSaveTrade();
  const del = useDeleteTrade();
  const [form, setForm] = useState(blank);
  const s = computeStats(trades);

  const num = (v: string) => (v === "" ? null : Number(v));

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Net P&L" value={fmtMoney(s.netPnl)} tone={s.netPnl} />
        <StatCard label="Win Rate" value={fmtPct(s.winRate)} />
        <StatCard label="Trades" value={s.count} />
        <StatCard label="Avg R" value={`${fmtNum(s.avgR)}R`} tone={s.avgR} />
        <StatCard
          label="Profit Factor"
          value={Number.isFinite(s.profitFactor) ? fmtNum(s.profitFactor) : "∞"}
        />
      </div>

      <Panel title={form.id ? "Edit trade" : "Log a trade"}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate({
              id: form.id,
              symbol: form.symbol.toUpperCase(),
              direction: form.direction,
              date: form.date,
              entry_price: num(form.entry_price),
              exit_price: num(form.exit_price),
              size: num(form.size),
              pnl: Number(form.pnl || 0),
              r_multiple: num(form.r_multiple),
              notes: form.notes || null,
            });
            setForm(blank);
          }}
          className="grid grid-cols-2 gap-2 md:grid-cols-5"
        >
          <input
            required
            placeholder="Symbol (EURUSD)"
            value={form.symbol}
            onChange={(e) => setForm({ ...form, symbol: e.target.value })}
            className={inputCls}
          />
          <select
            value={form.direction}
            onChange={(e) => setForm({ ...form, direction: e.target.value })}
            className={inputCls}
          >
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className={inputCls}
          />
          <input
            type="number"
            step="any"
            placeholder="Entry"
            value={form.entry_price}
            onChange={(e) => setForm({ ...form, entry_price: e.target.value })}
            className={inputCls}
          />
          <input
            type="number"
            step="any"
            placeholder="Exit"
            value={form.exit_price}
            onChange={(e) => setForm({ ...form, exit_price: e.target.value })}
            className={inputCls}
          />
          <input
            type="number"
            step="any"
            placeholder="Size (lots)"
            value={form.size}
            onChange={(e) => setForm({ ...form, size: e.target.value })}
            className={inputCls}
          />
          <input
            type="number"
            step="any"
            required
            placeholder="P&L ($)"
            value={form.pnl}
            onChange={(e) => setForm({ ...form, pnl: e.target.value })}
            className={inputCls}
          />
          <input
            type="number"
            step="any"
            placeholder="R multiple"
            value={form.r_multiple}
            onChange={(e) => setForm({ ...form, r_multiple: e.target.value })}
            className={inputCls}
          />
          <input
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className={`${inputCls} md:col-span-2`}
          />
          <div className="col-span-2 flex gap-2 md:col-span-5">
            <button className="rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground">
              {form.id ? "Save changes" : "Add trade"}
            </button>
            {form.id ? (
              <button
                type="button"
                onClick={() => setForm(blank)}
                className="rounded-md border border-border px-4 py-1.5 text-xs text-muted-foreground"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </Panel>

      <Panel title="All trades">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                {["Date", "Symbol", "Dir", "Entry", "Exit", "Size", "P&L", "R", "Notes", ""].map(
                  (h) => (
                    <th key={h} className="border-b border-border px-2 py-2 font-normal">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => (
                <tr key={t.id} className="border-b border-border/60">
                  <td className="num px-2 py-2 text-muted-foreground">{t.date}</td>
                  <td className="num px-2 py-2">{t.symbol}</td>
                  <td className="px-2 py-2 uppercase text-muted-foreground">{t.direction}</td>
                  <td className="num px-2 py-2">{t.entry_price ?? "—"}</td>
                  <td className="num px-2 py-2">{t.exit_price ?? "—"}</td>
                  <td className="num px-2 py-2">{t.size ?? "—"}</td>
                  <td className={`num px-2 py-2 ${pnlClass(Number(t.pnl))}`}>
                    {fmtMoney(t.pnl)}
                  </td>
                  <td className="num px-2 py-2">
                    {t.r_multiple === null ? "—" : `${fmtNum(t.r_multiple)}R`}
                  </td>
                  <td className="max-w-[220px] truncate px-2 py-2 text-muted-foreground">
                    {t.notes}
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() =>
                          setForm({
                            id: t.id,
                            symbol: t.symbol,
                            direction: t.direction,
                            date: t.date,
                            entry_price: t.entry_price?.toString() ?? "",
                            exit_price: t.exit_price?.toString() ?? "",
                            size: t.size?.toString() ?? "",
                            pnl: t.pnl?.toString() ?? "",
                            r_multiple: t.r_multiple?.toString() ?? "",
                            notes: t.notes ?? "",
                          })
                        }
                        className="text-muted-foreground hover:text-primary"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button onClick={() => del.mutate(t.id)} className="text-loss">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!trades.length ? (
                <tr>
                  <td colSpan={10} className="px-2 py-6 text-center text-muted-foreground">
                    No trades logged yet
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
