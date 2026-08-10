ALTER TABLE public.news_events
  ADD COLUMN IF NOT EXISTS actual text,
  ADD COLUMN IF NOT EXISTS forecast text,
  ADD COLUMN IF NOT EXISTS previous text,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';

CREATE UNIQUE INDEX IF NOT EXISTS news_events_sync_key
  ON public.news_events (user_id, date, coalesce(time, ''), coalesce(currency, ''), title);