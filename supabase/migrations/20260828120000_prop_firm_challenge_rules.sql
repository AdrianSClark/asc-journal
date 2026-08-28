-- Challenge rules on prop_firm_accounts, defaulted to ACG Alpha Pro 8% terms.
ALTER TABLE public.prop_firm_accounts
  ADD COLUMN IF NOT EXISTS profit_target_pct NUMERIC NOT NULL DEFAULT 0.08,
  ADD COLUMN IF NOT EXISTS max_drawdown_pct NUMERIC NOT NULL DEFAULT 0.08,
  ADD COLUMN IF NOT EXISTS daily_loss_cap_pct NUMERIC NOT NULL DEFAULT 0.04,
  ADD COLUMN IF NOT EXISTS risk_per_trade_pct NUMERIC NOT NULL DEFAULT 0.008,
  ADD COLUMN IF NOT EXISTS max_trades_per_day INTEGER NOT NULL DEFAULT 4;

-- Link trades to a prop firm account so the drawdown tracker can use real
-- logged trades instead of manual day-by-day entry. Nullable: trades not
-- tied to a challenge (e.g. personal live account) are unaffected.
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.prop_firm_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS trades_account_id_idx ON public.trades (account_id);
