import type { ReactNode } from "react";
import { pnlClass } from "@/lib/format";

export function StatCard({
  label,
  value,
  tone,
  sub,
}: {
  label: string;
  value: ReactNode;
  tone?: number;
  sub?: string;
}) {
  return (
    <div className="panel px-4 py-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div
        className={`num mt-1 text-xl ${tone === undefined ? "text-foreground" : pnlClass(tone)}`}
      >
        {value}
      </div>
      {sub ? <div className="num mt-0.5 text-[11px] text-muted-foreground">{sub}</div> : null}
    </div>
  );
}

export function Panel({
  title,
  children,
  right,
}: {
  title?: string;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <section className="panel p-4">
      {title ? (
        <header className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-wide">{title}</h2>
          {right}
        </header>
      ) : null}
      {children}
    </section>
  );
}
