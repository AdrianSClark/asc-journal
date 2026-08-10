import { createServerFn } from "@tanstack/react-start";

export type RatesPayload = { base: "USD"; rates: Record<string, number>; fetchedAt: string };

export const getUsdRates = createServerFn({ method: "GET" }).handler(
  async (): Promise<RatesPayload | null> => {
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      if (!res.ok) return null;
      const json = (await res.json()) as { result?: string; rates?: Record<string, number> };
      if (json.result !== "success" || !json.rates) return null;
      return { base: "USD", rates: json.rates, fetchedAt: new Date().toISOString() };
    } catch {
      return null;
    }
  },
);
