export const fmtMoney = (n: number | null | undefined) => {
  const v = Number(n ?? 0);
  const s = Math.abs(v).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${v < 0 ? "-" : ""}$${s}`;
};

export const fmtPct = (n: number | null | undefined) => `${Number(n ?? 0).toFixed(1)}%`;

export const fmtNum = (n: number | null | undefined, d = 2) => Number(n ?? 0).toFixed(d);

export const fmtR = (n: number | null | undefined) => `${Number(n ?? 0).toFixed(2)}R`;

export const fmtDate = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const pnlClass = (n: number) =>
  n > 0 ? "text-profit" : n < 0 ? "text-loss" : "text-muted-foreground";
