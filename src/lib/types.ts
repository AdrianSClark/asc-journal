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
};

export type NewsEvent = {
  id: string;
  date: string;
  time: string | null;
  currency: string | null;
  impact: string;
  title: string;
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
};

export type SmartKey =
  | "achievable"
  | "strategic"
  | "measurable"
  | "controllable"
  | "flexible"
  | "positive";

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

export const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const emptyPlan = (): TradingPlan => ({
  outcome_goal: "",
  strategic_goal: "",
  smart_checklist: SMART_KEYS.reduce(
    (acc, s) => ({ ...acc, [s.key]: { yes: false, no: false, why: "" } }),
    {} as Record<SmartKey, SmartRow>,
  ),
  weekly_actions: DAYS.reduce((acc, d) => ({ ...acc, [d]: "" }), {} as Record<string, string>),
});
