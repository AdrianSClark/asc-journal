import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { emptyPlan, type NewsEvent, type PropFirmAccount, type Trade, type TradingPlan, type WeeklyGoal } from "./types";

type Draft<T> = { [K in keyof T]?: T[K] | undefined } & { id?: string | undefined };

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export function useTrades() {
  return useQuery({
    queryKey: ["trades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Trade[];
    },
  });
}

export function useSaveTrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: Draft<Trade>) => {
      const user_id = await uid();
      if (t.id) {
        const { id, ...rest } = t;
        const { error } = await supabase.from("trades").update(rest as never).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("trades").insert({ ...t, user_id } as never);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trades"] }),
  });
}

export function useDeleteTrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("trades").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trades"] }),
  });
}

export function useNews() {
  return useQuery({
    queryKey: ["news_events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_events")
        .select("*")
        .order("date")
        .order("time");
      if (error) throw error;
      return (data ?? []) as unknown as NewsEvent[];
    },
  });
}

export function useSaveNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (e: Draft<NewsEvent>) => {
      const user_id = await uid();
      if (e.id) {
        const { id, ...rest } = e;
        const { error } = await supabase.from("news_events").update(rest as never).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("news_events").insert({ ...e, user_id } as never);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["news_events"] }),
  });
}

export function useDeleteNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("news_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["news_events"] }),
  });
}

export function useGoals() {
  return useQuery({
    queryKey: ["weekly_goals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_goals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as WeeklyGoal[];
    },
  });
}

export function useSaveGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (g: Draft<WeeklyGoal>) => {
      const user_id = await uid();
      if (g.id) {
        const { id, ...rest } = g;
        const { error } = await supabase.from("weekly_goals").update(rest as never).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("weekly_goals").insert({ ...g, user_id } as never);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["weekly_goals"] }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("weekly_goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["weekly_goals"] }),
  });
}

export function usePropFirms() {
  return useQuery({
    queryKey: ["prop_firm_accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prop_firm_accounts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PropFirmAccount[];
    },
  });
}

export function useSavePropFirm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Draft<PropFirmAccount>) => {
      const user_id = await uid();
      const { error } = await supabase.from("prop_firm_accounts").insert({ ...p, user_id } as never);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prop_firm_accounts"] }),
  });
}

export function useDeletePropFirm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("prop_firm_accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prop_firm_accounts"] }),
  });
}

export function usePlan() {
  return useQuery({
    queryKey: ["trading_plan"],
    queryFn: async () => {
      const { data, error } = await supabase.from("trading_plan").select("*").maybeSingle();
      if (error) throw error;
      if (!data) return emptyPlan();
      const base = emptyPlan();
      const row = data as unknown as TradingPlan;
      return {
        outcome_goal: row.outcome_goal ?? "",
        strategic_goal: row.strategic_goal ?? "",
        smart_checklist: { ...base.smart_checklist, ...(row.smart_checklist ?? {}) },
        weekly_actions: { ...base.weekly_actions, ...(row.weekly_actions ?? {}) },
      } as TradingPlan;
    },
  });
}

export function useSavePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plan: TradingPlan) => {
      const user_id = await uid();
      const { error } = await supabase
        .from("trading_plan")
        .upsert({ ...plan, user_id } as never, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trading_plan"] }),
  });
}

export function useAccountSettings() {
  return useQuery({
    queryKey: ["account_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("account_settings").select("*").maybeSingle();
      if (error) throw error;
      return { account_balance: Number((data as { account_balance?: number } | null)?.account_balance ?? 10000) };
    },
  });
}

export function useSaveBalance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (account_balance: number) => {
      const user_id = await uid();
      const { error } = await supabase
        .from("account_settings")
        .upsert({ account_balance, user_id } as never, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["account_settings"] }),
  });
}
