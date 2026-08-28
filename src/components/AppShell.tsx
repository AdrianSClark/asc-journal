import { useEffect, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAccountSettings, useTrades } from "@/lib/data";
import { computeStats } from "@/lib/stats";
import { Ticker } from "./Ticker";

const TABS = [
  { to: "/", label: "Dashboard" },
  { to: "/trades", label: "Trades" },
  { to: "/analytics", label: "Analytics" },
  { to: "/calendar", label: "Calendar" },
  { to: "/risk-calculator", label: "Risk Calculator" },
  { to: "/lot-calculator", label: "Lot Calculator" },
  { to: "/prop-firm-plan", label: "Challenge Plan" },
  { to: "/weekly-goals", label: "Weekly Goals" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  const { data: trades = [] } = useTrades();
  const { data: settings } = useAccountSettings();
  const stats = computeStats(trades);

  if (loading || !session) {
    return (
      <div className="num flex min-h-screen items-center justify-center text-xs text-muted-foreground">
        Loading terminal…
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Ticker stats={stats} balance={settings?.account_balance ?? 0} />
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link to="/" className="font-display text-lg font-bold tracking-tight">
            Ledger<span className="text-primary">.</span>
          </Link>
          <nav className="flex flex-wrap gap-1 text-xs">
            {TABS.map((t) => {
              const active = pathname === t.to;
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={`rounded-md border px-3 py-1.5 transition-colors ${
                    active
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth" });
            }}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="size-3.5" /> Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] space-y-4 px-4 py-5">{children}</main>
      <footer className="mx-auto max-w-[1400px] px-4 pb-8 pt-2 text-[11px] leading-relaxed text-muted-foreground">
        Ledger is a journaling and position-sizing tool only. Nothing here is financial advice.
        Figures are self-reported and calculators use approximations — always verify with your
        broker before placing a trade.
      </footer>
    </div>
  );
}
