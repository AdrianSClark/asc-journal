import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Panel, StatCard } from "@/components/StatCard";
import { useAccountSettings, useSaveBalance } from "@/lib/data";
import { fmtMoney, fmtNum } from "@/lib/format";
import { getUsdRates } from "@/lib/rates.functions";

export const Route = createFileRoute("/lot-calculator")({
  head: () => ({
    meta: [
      { title: "Lot Calculator — Ledger Trading Journal" },
      {
        name: "description",
        content:
          "Position size calculator for forex, metals, indices and crypto — risk in % or dollars, stop in pips or prices, with nano to standard lot breakdown.",
      },
      { property: "og:title", content: "Lot Calculator — Ledger Trading Journal" },
      {
        property: "og:description",
        content: "Convert risk and stop distance into lot size, units, position value and margin.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
const labelCls = "text-[10px] uppercase tracking-widest text-muted-foreground";

type Instrument = {
  key: string;
  label: string;
  group: string;
  pipSize: number;
  pipValuePerLot: number | null; // null = user must enter
  unitsPerLot: number;
  quote?: string; // quote currency for live conversion
};

const INSTRUMENTS: Instrument[] = [
  // Forex majors
  { key: "EURUSD", label: "EUR/USD", group: "Forex — Majors", pipSize: 0.0001, pipValuePerLot: 10, unitsPerLot: 100000, quote: "USD" },
  { key: "GBPUSD", label: "GBP/USD", group: "Forex — Majors", pipSize: 0.0001, pipValuePerLot: 10, unitsPerLot: 100000, quote: "USD" },
  { key: "AUDUSD", label: "AUD/USD", group: "Forex — Majors", pipSize: 0.0001, pipValuePerLot: 10, unitsPerLot: 100000, quote: "USD" },
  { key: "NZDUSD", label: "NZD/USD", group: "Forex — Majors", pipSize: 0.0001, pipValuePerLot: 10, unitsPerLot: 100000, quote: "USD" },
  { key: "USDCAD", label: "USD/CAD", group: "Forex — Majors", pipSize: 0.0001, pipValuePerLot: 7.4, unitsPerLot: 100000, quote: "CAD" },
  { key: "USDCHF", label: "USD/CHF", group: "Forex — Majors", pipSize: 0.0001, pipValuePerLot: 11.3, unitsPerLot: 100000, quote: "CHF" },
  // Minors
  { key: "EURGBP", label: "EUR/GBP", group: "Forex — Minors", pipSize: 0.0001, pipValuePerLot: 12.5, unitsPerLot: 100000, quote: "GBP" },
  { key: "EURCHF", label: "EUR/CHF", group: "Forex — Minors", pipSize: 0.0001, pipValuePerLot: 11.3, unitsPerLot: 100000, quote: "CHF" },
  { key: "EURAUD", label: "EUR/AUD", group: "Forex — Minors", pipSize: 0.0001, pipValuePerLot: 6.6, unitsPerLot: 100000, quote: "AUD" },
  { key: "GBPCHF", label: "GBP/CHF", group: "Forex — Minors", pipSize: 0.0001, pipValuePerLot: 11.3, unitsPerLot: 100000, quote: "CHF" },
  // JPY crosses
  { key: "USDJPY", label: "USD/JPY", group: "Forex — JPY crosses", pipSize: 0.01, pipValuePerLot: 9.1, unitsPerLot: 100000, quote: "JPY" },
  { key: "EURJPY", label: "EUR/JPY", group: "Forex — JPY crosses", pipSize: 0.01, pipValuePerLot: 9.1, unitsPerLot: 100000, quote: "JPY" },
  { key: "GBPJPY", label: "GBP/JPY", group: "Forex — JPY crosses", pipSize: 0.01, pipValuePerLot: 9.1, unitsPerLot: 100000, quote: "JPY" },
  { key: "AUDJPY", label: "AUD/JPY", group: "Forex — JPY crosses", pipSize: 0.01, pipValuePerLot: 9.1, unitsPerLot: 100000, quote: "JPY" },
  { key: "NZDJPY", label: "NZD/JPY", group: "Forex — JPY crosses", pipSize: 0.01, pipValuePerLot: 9.1, unitsPerLot: 100000, quote: "JPY" },
  // Metals
  { key: "XAUUSD", label: "XAU/USD (Gold, 100oz)", group: "Metals", pipSize: 0.1, pipValuePerLot: 10, unitsPerLot: 100, quote: "USD" },
  { key: "XAGUSD", label: "XAG/USD (Silver, 2500oz)", group: "Metals", pipSize: 0.01, pipValuePerLot: 25, unitsPerLot: 2500, quote: "USD" },
  // Indices — no presets
  { key: "US30", label: "US30", group: "Indices", pipSize: 1, pipValuePerLot: null, unitsPerLot: 1 },
  { key: "NAS100", label: "NAS100", group: "Indices", pipSize: 1, pipValuePerLot: null, unitsPerLot: 1 },
  { key: "US500", label: "US500", group: "Indices", pipSize: 1, pipValuePerLot: null, unitsPerLot: 1 },
  { key: "UK100", label: "UK100", group: "Indices", pipSize: 1, pipValuePerLot: null, unitsPerLot: 1 },
  // Crypto — no presets
  { key: "BTCUSD", label: "BTC/USD", group: "Crypto", pipSize: 1, pipValuePerLot: null, unitsPerLot: 1 },
  { key: "ETHUSD", label: "ETH/USD", group: "Crypto", pipSize: 1, pipValuePerLot: null, unitsPerLot: 1 },
  { key: "CUSTOM", label: "Custom instrument", group: "Custom", pipSize: 1, pipValuePerLot: null, unitsPerLot: 1 },
];

const GROUPS = [...new Set(INSTRUMENTS.map((i) => i.group))];

const LOT_STEPS: { name: string; size: number }[] = [
  { name: "Nano", size: 0.001 },
  { name: "Micro", size: 0.01 },
  { name: "Mini", size: 0.1 },
  { name: "Standard", size: 1 },
];

function LotBody() {
  const { data: settings } = useAccountSettings();
  const saveBalance = useSaveBalance();

  const [balance, setBalance] = useState("10000");
  const [riskBasis, setRiskBasis] = useState<"percent" | "amount">("percent");
  const [riskPct, setRiskPct] = useState(1);
  const [riskAmt, setRiskAmt] = useState("100");
  const [key, setKey] = useState("EURUSD");
  const [stopMode, setStopMode] = useState<"pips" | "price">("pips");
  const [pips, setPips] = useState("20");
  const [entry, setEntry] = useState("");
  const [stop, setStop] = useState("");
  const [customPointSize, setCustomPointSize] = useState("1");
  const [customPointValue, setCustomPointValue] = useState("");
  const [customUnits, setCustomUnits] = useState("1");
  const [price, setPrice] = useState("");
  const [leverage, setLeverage] = useState("");

  useEffect(() => {
    if (settings) setBalance(String(settings.account_balance));
  }, [settings]);

  const rates = useQuery({
    queryKey: ["usd-rates"],
    queryFn: () => getUsdRates(),
    staleTime: 1000 * 60 * 30,
  });

  const inst = INSTRUMENTS.find((i) => i.key === key) ?? (INSTRUMENTS[0] as Instrument);
  const needsManualSpec = inst.pipValuePerLot === null;

  const pipSize = needsManualSpec ? Number(customPointSize || 1) : inst.pipSize;
  const unitsPerLot = needsManualSpec ? Number(customUnits || 1) : inst.unitsPerLot;

  // Live pip value: value of one pip on a standard lot, converted to USD.
  const { pipValuePerLot, live } = useMemo(() => {
    if (needsManualSpec) return { pipValuePerLot: Number(customPointValue || 0), live: false };
    const table = rates.data?.rates;
    const quote = inst.quote;
    if (table && quote) {
      const rate = quote === "USD" ? 1 : table[quote];
      if (rate && rate > 0) {
        return { pipValuePerLot: (inst.pipSize * inst.unitsPerLot) / rate, live: true };
      }
    }
    return { pipValuePerLot: inst.pipValuePerLot ?? 0, live: false };
  }, [inst, needsManualSpec, customPointValue, rates.data]);

  const bal = Number(balance || 0);
  const riskAmount = riskBasis === "percent" ? (bal * riskPct) / 100 : Number(riskAmt || 0);
  const stopDistance =
    stopMode === "pips"
      ? Number(pips || 0)
      : pipSize
        ? Math.abs(Number(entry || 0) - Number(stop || 0)) / pipSize
        : 0;

  const lots = stopDistance && pipValuePerLot ? riskAmount / (stopDistance * pipValuePerLot) : 0;
  const mkt = Number(price || 0);
  const lev = Number(leverage || 0);

  const rows = LOT_STEPS.map((step) => {
    const count = lots / step.size;
    const units = lots * unitsPerLot;
    const positionValue = mkt ? units * mkt : null;
    const margin = positionValue && lev ? positionValue / lev : null;
    return { ...step, count, units, positionValue, margin };
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Risk">
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Account balance</label>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                onBlur={() => saveBalance.mutate(Number(balance || 0))}
                className={`${inputCls} mt-1`}
              />
            </div>
            <div className="flex gap-2">
              {(
                [
                  ["percent", "% of balance"],
                  ["amount", "Fixed $ amount"],
                ] as const
              ).map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setRiskBasis(v)}
                  className={`flex-1 rounded-md border px-3 py-1.5 text-xs ${
                    riskBasis === v
                      ? "border-primary/60 bg-primary/15 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            {riskBasis === "percent" ? (
              <div>
                <label className={`flex items-center justify-between ${labelCls}`}>
                  Risk per trade <span className="num text-primary">{riskPct.toFixed(1)}%</span>
                </label>
                <input
                  type="range"
                  min={0.1}
                  max={10}
                  step={0.1}
                  value={riskPct}
                  onChange={(e) => setRiskPct(Number(e.target.value))}
                  className="mt-2 w-full accent-[var(--primary)]"
                />
              </div>
            ) : (
              <div>
                <label className={labelCls}>Risk amount ($)</label>
                <input
                  type="number"
                  step="any"
                  value={riskAmt}
                  onChange={(e) => setRiskAmt(e.target.value)}
                  className={`${inputCls} mt-1`}
                />
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Instrument & stop">
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Instrument</label>
              <select
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className={`${inputCls} mt-1`}
              >
                {GROUPS.map((g) => (
                  <optgroup key={g} label={g}>
                    {INSTRUMENTS.filter((i) => i.group === g).map((i) => (
                      <option key={i.key} value={i.key}>
                        {i.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <p className="num mt-1 text-[10px] text-muted-foreground">
                {needsManualSpec
                  ? "Contract specs vary significantly by broker — enter point size and value manually."
                  : `1 pip = ${inst.pipSize} · ${fmtMoney(pipValuePerLot)} per standard lot ${
                      live ? "(live rate)" : "(static preset)"
                    }`}
              </p>
            </div>

            {needsManualSpec ? (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className={labelCls}>Point size</label>
                  <input
                    type="number"
                    step="any"
                    value={customPointSize}
                    onChange={(e) => setCustomPointSize(e.target.value)}
                    className={`${inputCls} mt-1`}
                  />
                </div>
                <div>
                  <label className={labelCls}>Point value / lot</label>
                  <input
                    type="number"
                    step="any"
                    value={customPointValue}
                    onChange={(e) => setCustomPointValue(e.target.value)}
                    className={`${inputCls} mt-1`}
                  />
                </div>
                <div>
                  <label className={labelCls}>Units / lot</label>
                  <input
                    type="number"
                    step="any"
                    value={customUnits}
                    onChange={(e) => setCustomUnits(e.target.value)}
                    className={`${inputCls} mt-1`}
                  />
                </div>
              </div>
            ) : null}

            <div className="flex gap-2">
              {(
                [
                  ["pips", "Stop in pips/points"],
                  ["price", "Entry & stop price"],
                ] as const
              ).map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setStopMode(v)}
                  className={`flex-1 rounded-md border px-3 py-1.5 text-xs ${
                    stopMode === v
                      ? "border-primary/60 bg-primary/15 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {stopMode === "pips" ? (
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

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Market price (optional)</label>
                <input
                  type="number"
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={`${inputCls} mt-1`}
                />
              </div>
              <div>
                <label className={labelCls}>Leverage (optional)</label>
                <input
                  type="number"
                  step="any"
                  value={leverage}
                  onChange={(e) => setLeverage(e.target.value)}
                  placeholder="30"
                  className={`${inputCls} mt-1`}
                />
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Risk amount" value={fmtMoney(riskAmount)} tone={-1} />
        <StatCard
          label="Stop distance"
          value={stopDistance ? `${fmtNum(stopDistance, 1)} pips` : "—"}
        />
        <StatCard label="Pip value / lot" value={pipValuePerLot ? fmtMoney(pipValuePerLot) : "—"} />
        <StatCard
          label="Position size"
          value={lots ? `${fmtNum(lots, 3)} lots` : "—"}
          {...(lots ? { sub: `${fmtNum(lots * unitsPerLot, 0)} units` } : {})}
        />
      </div>

      <Panel title="Lot breakdown">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="py-2 pr-3">Lot type</th>
                <th className="py-2 pr-3">Size</th>
                <th className="py-2 pr-3">Lots</th>
                <th className="py-2 pr-3">Units</th>
                <th className="py-2 pr-3">Position value</th>
                <th className="py-2">Margin</th>
              </tr>
            </thead>
            <tbody className="num">
              {rows.map((r) => (
                <tr key={r.name} className="border-t border-border">
                  <td className="py-2 pr-3 font-sans">{r.name}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{r.size}</td>
                  <td className="py-2 pr-3 text-primary">{lots ? fmtNum(r.count, 2) : "—"}</td>
                  <td className="py-2 pr-3">{lots ? fmtNum(r.units, 0) : "—"}</td>
                  <td className="py-2 pr-3">
                    {r.positionValue !== null ? fmtMoney(r.positionValue) : "—"}
                  </td>
                  <td className="py-2">{r.margin !== null ? fmtMoney(r.margin) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          lots = risk amount ÷ (stop pips × pip value per lot). Pip/point values are approximations
          that move with exchange rates — verify against your broker before sizing large positions.
          For position sizing and journaling only, not financial advice.
        </p>
      </Panel>
    </div>
  );
}
