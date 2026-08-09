import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Panel, StatCard } from "@/components/StatCard";
import { useAccountSettings, useSaveBalance } from "@/lib/data";
import { fmtMoney, fmtNum } from "@/lib/format";

export const Route = createFileRoute("/lot-calculator")({
  head: () => ({
    meta: [
      { title: "Lot Calculator — Ledger Trading Journal" },
      {
        name: "description",
        content:
          "Convert risk and stop-loss distance into lot size for forex pairs, gold, indices and crypto with per-instrument pip values.",
      },
      { property: "og:title", content: "Lot Calculator — Ledger Trading Journal" },
      {
        property: "og:description",
        content: "Convert risk and stop distance into lot size per instrument.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <LotBody />
    </AppShell>
  ),
});

const inputCls =
  "num w-full rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-sm outline-none focus:border-primary/60";

type Instrument = {
  label: string;
  pipSize: number;
  pipValuePerLot: number;
  unitsPerLot: number;
  hint: string;
};

const INSTRUMENTS: Record<string, Instrument> = {
  "EUR/USD": { label: "EUR/USD", pipSize: 0.0001, pipValuePerLot: 10, unitsPerLot: 100000, hint: "1 pip = 0.0001" },
  "GBP/USD": { label: "GBP/USD", pipSize: 0.0001, pipValuePerLot: 10, unitsPerLot: 100000, hint: "1 pip = 0.0001" },
  "AUD/USD": { label: "AUD/USD", pipSize: 0.0001, pipValuePerLot: 10, unitsPerLot: 100000, hint: "1 pip = 0.0001" },
  "USD/JPY": { label: "USD/JPY", pipSize: 0.01, pipValuePerLot: 6.7, unitsPerLot: 100000, hint: "1 pip = 0.01" },
  "XAU/USD": { label: "XAU/USD (Gold)", pipSize: 0.1, pipValuePerLot: 10, unitsPerLot: 100, hint: "1 pip = $0.10" },
  US30: { label: "US30", pipSize: 1, pipValuePerLot: 1, unitsPerLot: 1, hint: "1 point = $1 / lot" },
  NAS100: { label: "NAS100", pipSize: 1, pipValuePerLot: 1, unitsPerLot: 1, hint: "1 point = $1 / lot" },
  "BTC/USD": { label: "BTC/USD", pipSize: 1, pipValuePerLot: 1, unitsPerLot: 1, hint: "1 point = $1 / lot" },
};

function LotBody() {
  const { data: settings } = useAccountSettings();
  const saveBalance = useSaveBalance();
  const [balance, setBalance] = useState("10000");
  const [risk, setRisk] = useState(1);
  const [key, setKey] = useState("EUR/USD");
  const [mode, setMode] = useState<"pips" | "price">("pips");
  const [pips, setPips] = useState("20");
  const [entry, setEntry] = useState("");
  const [stop, setStop] = useState("");

  useEffect(() => {
    if (settings) setBalance(String(settings.account_balance));
  }, [settings]);

  const inst = INSTRUMENTS[key] as Instrument;
  const bal = Number(balance || 0);
  const riskAmount = (bal * risk) / 100;
  const pipDistance =
    mode === "pips"
      ? Number(pips || 0)
      : Math.abs(Number(entry || 0) - Number(stop || 0)) / inst.pipSize;
  const lots = pipDistance ? riskAmount / (pipDistance * inst.pipValuePerLot) : 0;
  const units = lots * inst.unitsPerLot;
  const pipValue = lots * inst.pipValuePerLot;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Inputs">
        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Instrument
            </label>
            <select
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className={`${inputCls} mt-1`}
            >
              {Object.entries(INSTRUMENTS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
            <p className="num mt-1 text-[10px] text-muted-foreground">{inst.hint}</p>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Account balance
            </label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
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
              onChange={(e) => setRisk(Number(e.target.value))}
              className="mt-2 w-full accent-[var(--primary)]"
            />
          </div>
          <div className="flex gap-2">
            {(["pips", "price"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-md border px-3 py-1.5 text-xs ${
                  mode === m
                    ? "border-primary/60 bg-primary/15 text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                {m === "pips" ? "Stop in pips" : "Entry & stop price"}
              </button>
            ))}
          </div>
          {mode === "pips" ? (
            <input
              type="number"
              step="any"
              value={pips}
              onChange={(e) => setPips(e.target.value)}
              placeholder="Stop loss in pips"
              className={inputCls}
            />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="any"
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                placeholder="Entry price"
                className={inputCls}
              />
              <input
                type="number"
                step="any"
                value={stop}
                onChange={(e) => setStop(e.target.value)}
                placeholder="Stop price"
                className={inputCls}
              />
            </div>
          )}
        </div>
      </Panel>

      <div className="space-y-4">
        <Panel title="Lot size">
          <div className="num text-4xl text-primary">{lots ? fmtNum(lots, 2) : "—"}</div>
          <p className="num mt-1 text-[11px] text-muted-foreground">
            standard lots · {units ? fmtNum(units, 0) : "—"} units
          </p>
        </Panel>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Risk amount" value={fmtMoney(riskAmount)} tone={-1} />
          <StatCard label="Stop distance" value={pipDistance ? `${fmtNum(pipDistance, 1)} pips` : "—"} />
          <StatCard label="Pip value" value={fmtMoney(pipValue)} sub="per pip at this size" />
          <StatCard label="Micro lots" value={lots ? fmtNum(lots * 100, 0) : "—"} />
        </div>
        <p className="text-[11px] text-muted-foreground">
          Pip values assume a USD-denominated account. For position sizing only — not financial
          advice.
        </p>
      </div>
    </div>
  );
}
