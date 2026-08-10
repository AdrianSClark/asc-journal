import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type FeedEvent = {
  title?: string;
  country?: string;
  date?: string;
  impact?: string;
  forecast?: string;
  previous?: string;
  actual?: string;
};

const FEEDS = [
  "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
  "https://nfs.faireconomy.media/ff_calendar_nextweek.json",
];

function parseWhen(iso: string): { date: string; time: string | null } | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const p = d.toISOString();
  return { date: p.slice(0, 10), time: p.slice(11, 16) };
}

export const syncEconomicCalendar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const raw: FeedEvent[] = [];
    for (const url of FEEDS) {
      try {
        const res = await fetch(url, { headers: { accept: "application/json" } });
        if (!res.ok) continue;
        const json = (await res.json()) as FeedEvent[];
        if (Array.isArray(json)) raw.push(...json);
      } catch {
        // ignore a failing feed and keep whatever we already have
      }
    }

    if (!raw.length) {
      return { ok: false as const, inserted: 0, error: "Calendar feed unavailable right now." };
    }

    const rows = raw
      .map((e) => {
        const when = e.date ? parseWhen(e.date) : null;
        if (!when || !e.title) return null;
        return {
          user_id: userId,
          date: when.date,
          time: when.time,
          currency: (e.country ?? "").toUpperCase() || null,
          impact: (e.impact ?? "low").toLowerCase(),
          title: e.title,
          forecast: e.forecast || null,
          previous: e.previous || null,
          actual: e.actual || null,
          source: "synced",
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    const dates = rows.map((r) => r.date).sort();
    const from = dates[0]!;
    const to = dates[dates.length - 1]!;

    // Replace the synced window; manually added events are never touched.
    const del = await supabase
      .from("news_events")
      .delete()
      .eq("source", "synced")
      .gte("date", from)
      .lte("date", to);
    if (del.error) throw del.error;

    const ins = await supabase.from("news_events").insert(rows as never);
    if (ins.error) throw ins.error;

    return { ok: true as const, inserted: rows.length, from, to };
  });
