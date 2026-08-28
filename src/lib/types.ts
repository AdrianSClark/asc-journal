export type Trade = {
  id: string;
  user_id: string;
  symbol: string;
  direction: string;
  entry_price: number | null;
  exit_price: number | null;
  size: number | null;
  pnl: number;
  r_multiple: number | null;
  date: string;
  notes: string | null;
  created_at: string;
  account_id: string | null;
};

export type NewsEvent = {
  id: string;
  date: string;
  time: string | null;
  currency: string | null;
  impact: string;
  title: string;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
  source: string;
};

export type WeeklyGoal = {
  id: string;
  title: string;
  tracking_type: string;
  target: number;
  current: number;
  unit: string | null;
  deadline: string | null;
};

export type PropFirmAccount = {
  id: string;
  firm: string;
  account_size: number;
  phase: string;
  status: string;
  start_date: string | null;
  notes: string | null;
  profit_target_pct: number;
  max_drawdown_pct: number;
  daily_loss_cap_pct: number;
  risk_per_trade_pct: number;
  max_trades_per_day: number;
};

// ACG Alpha Pro 8% ($50K model) — used to prefill new challenge accounts.
export const ALPHA_PRO_8_DEFAULTS = {
  profit_target_pct: 0.08,
  max_drawdown_pct: 0.08,
  daily_loss_cap_pct: 0.04,
  risk_per_trade_pct: 0.008,
  max_trades_per_day: 4,
};

// ADR assumptions from the risk plan — edit as volatility regimes shift.
export const PAIR_ADR: Record<string, { adrPips: number; pipValuePerLot: number }> = {
  "EUR/USD": { adrPips: 60, pipValuePerLot: 10 },
  "GBP/USD": { adrPips: 110, pipValuePerLot: 10 },
};

export type SmartKey =
  "achievable" | "strategic" | "measurable" | "controllable" | "flexible" | "positive";

export type SmartRow = { yes: boolean; no: boolean; why: string };

export type TradingPlan = {
  outcome_goal: string;
  strategic_goal: string;
  smart_checklist: Record<SmartKey, SmartRow>;
  weekly_actions: Record<string, string>;
};

export const SMART_KEYS: { key: SmartKey; label: string }[] = [
  { key: "achievable", label: "Achievable?" },
  { key: "strategic", label: "Strategic?" },
  { key: "measurable", label: "Measureable?" },
  { key: "controllable", label: "Controllable?" },
  { key: "flexible", label: "Flexible?" },
  { key: "positive", label: "Positive?" },
];

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const emptyPlan = (): TradingPlan => ({
  outcome_goal: "",
  strategic_goal: "",
  smart_checklist: SMART_KEYS.reduce(
    (acc, s) => ({ ...acc, [s.key]: { yes: false, no: false, why: "" } }),
    {} as Record<SmartKey, SmartRow>,
  ),
  weekly_actions: DAYS.reduce((acc, d) => ({ ...acc, [d]: "" }), {} as Record<string, string>),
});
