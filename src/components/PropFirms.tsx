import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useDeletePropFirm, usePropFirms, useSavePropFirm } from "@/lib/data";
import { fmtMoney, fmtPct } from "@/lib/format";
import { ALPHA_PRO_8_DEFAULTS } from "@/lib/types";

const inputCls =
  "num w-full rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-xs outline-none focus:border-primary/60";
const labelCls = "text-[10px] uppercase tracking-widest text-muted-foreground";

const PHASES = ["Challenge", "Verification", "Funded"];
const STATUSES = ["Active", "Passed", "Failed", "Payout received"];

const blank = {
  firm: "",
  account_size: "50000",
  phase: "Challenge",
  status: "Active",
  start_date: "",
  notes: "",
  profit_target_pct: String(ALPHA_PRO_8_DEFAULTS.profit_target_pct * 100),
  max_drawdown_pct: String(ALPHA_PRO_8_DEFAULTS.max_drawdown_pct * 100),
  daily_loss_cap_pct: String(ALPHA_PRO_8_DEFAULTS.daily_loss_cap_pct * 100),
  risk_per_trade_pct: String(ALPHA_PRO_8_DEFAULTS.risk_per_trade_pct * 100),
  max_trades_per_day: String(ALPHA_PRO_8_DEFAULTS.max_trades_per_day),
};

export function PropFirmAccounts() {
  const { data: rows = [] } = usePropFirms();
  const save = useSavePropFirm();
  const del = useDeletePropFirm();
  const [form, setForm] = useState(blank);
  const [showRules, setShowRules] = useState(false);

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate({
            firm: form.firm,
            account_size: Number(form.account_size || 0),
            phase: form.phase,
            status: form.status,
            start_date: form.start_date || null,
            notes: form.notes || null,
            profit_target_pct: Number(form.profit_target_pct || 0) / 100,
            max_drawdown_pct: Number(form.max_drawdown_pct || 0) / 100,
            daily_loss_cap_pct: Number(form.daily_loss_cap_pct || 0) / 100,
            risk_per_trade_pct: Number(form.risk_per_trade_pct || 0) / 100,
            max_trades_per_day: Number(form.max_trades_per_day || 0),
          });
          setForm(blank);
          setShowRules(false);
        }}
        className="space-y-3"
      >
        <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
          <input
            required
            placeholder="Firm"
            value={form.firm}
            onChange={(e) => setForm({ ...form, firm: e.target.value })}
            className={inputCls}
          />
          <input
            type="number"
            placeholder="Account size"
            value={form.account_size}
            onChange={(e) => setForm({ ...form, account_size: e.target.value })}
            className={inputCls}
          />
          <select
            value={form.phase}
            onChange={(e) => setForm({ ...form, phase: e.target.value })}
            className={inputCls}
          >
            {PHASES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className={inputCls}
          >
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            className={inputCls}
          />
          <input
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className={inputCls}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowRules((v) => !v)}
            className="text-[11px] text-primary underline-offset-2 hover:underline"
          >
            {showRules ? "Hide challenge rules" : "Challenge rules (defaults: Alpha Pro 8%)"}
          </button>
          <button
            type="button"
            onClick={() =>
              setForm({
                ...form,
                profit_target_pct: String(ALPHA_PRO_8_DEFAULTS.profit_target_pct * 100),
                max_drawdown_pct: String(ALPHA_PRO_8_DEFAULTS.max_drawdown_pct * 100),
                daily_loss_cap_pct: String(ALPHA_PRO_8_DEFAULTS.daily_loss_cap_pct * 100),
                risk_per_trade_pct: String(ALPHA_PRO_8_DEFAULTS.risk_per_trade_pct * 100),
                max_trades_per_day: String(ALPHA_PRO_8_DEFAULTS.max_trades_per_day),
              })
            }
            className="text-[11px] text-muted-foreground underline-offset-2 hover:underline"
          >
            Reset to Alpha Pro 8%
          </button>
        </div>

        {showRules ? (
          <div className="grid grid-cols-2 gap-2 rounded-md border border-border bg-surface-2 p-3 md:grid-cols-5">
            <div>
              <label className={labelCls}>Profit target %</label>
              <input
                type="number"
                step="any"
                value={form.profit_target_pct}
                onChange={(e) => setForm({ ...form, profit_target_pct: e.target.value })}
                className={`${inputCls} mt-1`}
              />
            </div>
            <div>
              <label className={labelCls}>Max drawdown %</label>
              <input
                type="number"
                step="any"
                value={form.max_drawdown_pct}
                onChange={(e) => setForm({ ...form, max_drawdown_pct: e.target.value })}
                className={`${inputCls} mt-1`}
              />
            </div>
            <div>
              <label className={labelCls}>Daily loss cap %</label>
              <input
                type="number"
                step="any"
                value={form.daily_loss_cap_pct}
                onChange={(e) => setForm({ ...form, daily_loss_cap_pct: e.target.value })}
                className={`${inputCls} mt-1`}
              />
            </div>
            <div>
              <label className={labelCls}>Risk per trade %</label>
              <input
                type="number"
                step="any"
                value={form.risk_per_trade_pct}
                onChange={(e) => setForm({ ...form, risk_per_trade_pct: e.target.value })}
                className={`${inputCls} mt-1`}
              />
            </div>
            <div>
              <label className={labelCls}>Max trades/day</label>
              <input
                type="number"
                value={form.max_trades_per_day}
                onChange={(e) => setForm({ ...form, max_trades_per_day: e.target.value })}
                className={`${inputCls} mt-1`}
              />
            </div>
          </div>
        ) : null}

        <button className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
          Add account
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr>
              {["Firm", "Size", "Phase", "Status", "Rules", "Start", "Notes", ""].map((h) => (
                <th key={h} className="border-b border-border px-2 py-2 font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border/60">
                <td className="px-2 py-2">{r.firm}</td>
                <td className="num px-2 py-2">{fmtMoney(r.account_size)}</td>
                <td className="px-2 py-2 text-muted-foreground">{r.phase}</td>
                <td className="px-2 py-2">{r.status}</td>
                <td className="px-2 py-2">
                  <Link
                    to="/prop-firm-plan"
                    search={{ account: r.id }}
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    {fmtPct(r.max_drawdown_pct * 100)} DD · {fmtPct(r.daily_loss_cap_pct * 100)}{" "}
                    daily
                  </Link>
                </td>
                <td className="num px-2 py-2 text-muted-foreground">{r.start_date ?? "—"}</td>
                <td className="px-2 py-2 text-muted-foreground">{r.notes}</td>
                <td className="px-2 py-2 text-right">
                  <button onClick={() => del.mutate(r.id)} className="text-loss">
                    <Trash2 className="size-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={8} className="px-2 py-4 text-center text-muted-foreground">
                  No prop firm accounts yet
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
