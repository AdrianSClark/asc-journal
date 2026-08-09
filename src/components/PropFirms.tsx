import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useDeletePropFirm, usePropFirms, useSavePropFirm } from "@/lib/data";
import { fmtMoney } from "@/lib/format";

const inputCls =
  "num w-full rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-xs outline-none focus:border-primary/60";

const PHASES = ["Challenge", "Verification", "Funded"];
const STATUSES = ["Active", "Passed", "Failed", "Payout received"];

export function PropFirmAccounts() {
  const { data: rows = [] } = usePropFirms();
  const save = useSavePropFirm();
  const del = useDeletePropFirm();
  const [form, setForm] = useState({
    firm: "",
    account_size: "",
    phase: "Challenge",
    status: "Active",
    start_date: "",
    notes: "",
  });

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
          });
          setForm({ ...form, firm: "", account_size: "", notes: "" });
        }}
        className="grid grid-cols-2 gap-2 md:grid-cols-7"
      >
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
        <button className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
          Add account
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr>
              {["Firm", "Size", "Phase", "Status", "Start", "Notes", ""].map((h) => (
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
                <td colSpan={7} className="px-2 py-4 text-center text-muted-foreground">
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
