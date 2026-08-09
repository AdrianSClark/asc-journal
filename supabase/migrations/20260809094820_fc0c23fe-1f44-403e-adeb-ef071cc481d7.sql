CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'long',
  entry_price NUMERIC,
  exit_price NUMERIC,
  size NUMERIC,
  pnl NUMERIC NOT NULL DEFAULT 0,
  r_multiple NUMERIC,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trades TO authenticated;
GRANT ALL ON public.trades TO service_role;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own trades" ON public.trades FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trades_updated BEFORE UPDATE ON public.trades FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.weekly_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  tracking_type TEXT NOT NULL DEFAULT 'custom',
  target NUMERIC NOT NULL DEFAULT 0,
  current NUMERIC NOT NULL DEFAULT 0,
  unit TEXT,
  deadline DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_goals TO authenticated;
GRANT ALL ON public.weekly_goals TO service_role;
ALTER TABLE public.weekly_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own goals" ON public.weekly_goals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER weekly_goals_updated BEFORE UPDATE ON public.weekly_goals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.news_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TEXT,
  currency TEXT,
  impact TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_events TO authenticated;
GRANT ALL ON public.news_events TO service_role;
ALTER TABLE public.news_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own news" ON public.news_events FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER news_events_updated BEFORE UPDATE ON public.news_events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.trading_plan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  outcome_goal TEXT NOT NULL DEFAULT '',
  smart_checklist JSONB NOT NULL DEFAULT '{}'::jsonb,
  strategic_goal TEXT NOT NULL DEFAULT '',
  weekly_actions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trading_plan TO authenticated;
GRANT ALL ON public.trading_plan TO service_role;
ALTER TABLE public.trading_plan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own plan" ON public.trading_plan FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trading_plan_updated BEFORE UPDATE ON public.trading_plan FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.prop_firm_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  firm TEXT NOT NULL,
  account_size NUMERIC NOT NULL DEFAULT 0,
  phase TEXT NOT NULL DEFAULT 'Challenge',
  status TEXT NOT NULL DEFAULT 'Active',
  start_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prop_firm_accounts TO authenticated;
GRANT ALL ON public.prop_firm_accounts TO service_role;
ALTER TABLE public.prop_firm_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own prop firms" ON public.prop_firm_accounts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER prop_firm_accounts_updated BEFORE UPDATE ON public.prop_firm_accounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.account_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  account_balance NUMERIC NOT NULL DEFAULT 10000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_settings TO authenticated;
GRANT ALL ON public.account_settings TO service_role;
ALTER TABLE public.account_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own settings" ON public.account_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER account_settings_updated BEFORE UPDATE ON public.account_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();