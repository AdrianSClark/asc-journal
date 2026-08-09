import { useEffect, useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { usePlan, useSavePlan } from "@/lib/data";
import { DAYS, SMART_KEYS, emptyPlan, type SmartKey, type TradingPlan } from "@/lib/types";

export function Collapsible({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="panel">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <h2 className="text-sm font-semibold tracking-wide">{title}</h2>
        <ChevronDown
          className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? <div className="border-t border-border p-4">{children}</div> : null}
    </section>
  );
}

const inputCls =
  "num w-full rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-xs outline-none focus:border-primary/60";

export function TradingPlanEditor() {
  const { data } = usePlan();
  const save = useSavePlan();
  const [plan, setPlan] = useState<TradingPlan>(emptyPlan());

  useEffect(() => {
    if (data) setPlan(data);
  }, [data]);

  const update = (next: TradingPlan) => {
    setPlan(next);
    save.mutate(next);
  };

  const toggle = (key: SmartKey, field: "yes" | "no") => {
    const row = plan.smart_checklist[key];
    update({
      ...plan,
      smart_checklist: {
        ...plan.smart_checklist,
        [key]: { ...row, [field]: !row[field] },
      },
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Outcome goal — my goal is to...
        </label>
        <textarea
          rows={3}
          value={plan.outcome_goal}
          onChange={(e) => setPlan({ ...plan, outcome_goal: e.target.value })}
          onBlur={() => save.mutate(plan)}
          className={`${inputCls} mt-1`}
        />
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Is it SMART?
        </div>
        <div className="mt-2 space-y-2">
          {SMART_KEYS.map(({ key, label }) => {
            const row = plan.smart_checklist[key];
            return (
              <div
                key={key}
                className="grid grid-cols-1 items-center gap-2 md:grid-cols-[140px_auto_1fr]"
              >
                <span className="text-xs">{label}</span>
                <div className="flex gap-1.5">
                  {(["yes", "no"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => toggle(key, f)}
                      className={`rounded-md border px-3 py-1 text-[11px] uppercase tracking-wide transition-colors ${
                        row[f]
                          ? "border-primary/60 bg-primary/15 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <input
                  placeholder="Why?"
                  value={row.why}
                  onChange={(e) =>
                    setPlan({
                      ...plan,
                      smart_checklist: {
                        ...plan.smart_checklist,
                        [key]: { ...row, why: e.target.value },
                      },
                    })
                  }
                  onBlur={() => save.mutate(plan)}
                  className={inputCls}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Strategic goal
        </label>
        <textarea
          rows={3}
          value={plan.strategic_goal}
          onChange={(e) => setPlan({ ...plan, strategic_goal: e.target.value })}
          onBlur={() => save.mutate(plan)}
          className={`${inputCls} mt-1`}
        />
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          In order to reach this goal, I am going to...
        </div>
        <div className="mt-2 space-y-1.5">
          {DAYS.map((d) => (
            <div key={d} className="grid grid-cols-1 items-center gap-2 md:grid-cols-[140px_1fr]">
              <span className="text-xs text-muted-foreground">{d}</span>
              <input
                value={plan.weekly_actions[d] ?? ""}
                onChange={(e) =>
                  setPlan({
                    ...plan,
                    weekly_actions: { ...plan.weekly_actions, [d]: e.target.value },
                  })
                }
                onBlur={() => save.mutate(plan)}
                className={inputCls}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { Trash2 };
