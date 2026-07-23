import { supabase } from "../lib/supabase";
import type { Company } from "../types";

export type SubscriptionPlan = "trial" | "standard" | "professional" | "enterprise";
export type SubscriptionStatus = "active" | "past_due" | "suspended" | "cancelled";

export interface CompanySubscription extends Company {
  municipality_name?: string;
}

export interface SubscriptionStats {
  totalCompanies: number;
  byStatus: Record<SubscriptionStatus, number>;
  trialsEndingSoon: number;
  totalSubscriptionRevenue: number;
}

async function logAudit(action: string, recordId: string, oldValues?: object | null, newValues?: object | null) {
  try {
    const { data: authData } = await supabase.auth.getUser();
    await supabase.from("audit_logs").insert({
      user_id: authData.user?.id,
      action,
      table_name: "companies",
      record_id: recordId,
      old_values: oldValues ?? null,
      new_values: newValues ?? null,
    });
  } catch (err) {
    console.error("Imeshindikana kuandika audit log:", err);
  }
}

export async function getCompanySubscriptions(): Promise<CompanySubscription[]> {
  const [companiesRes, municipalitiesRes] = await Promise.all([
    supabase.from("companies").select("*").order("name"),
    supabase.from("municipalities").select("id, name"),
  ]);

  if (companiesRes.error) throw companiesRes.error;

  const municipalityMap = new Map((municipalitiesRes.data ?? []).map((m) => [m.id, m.name]));

  return (companiesRes.data ?? []).map((c) => ({
    ...c,
    municipality_name: municipalityMap.get(c.municipality_id) ?? "—",
  }));
}

export async function getSubscriptionStats(): Promise<SubscriptionStats> {
  const { data: companies, error } = await supabase
    .from("companies")
    .select("subscription_status, subscription_plan, trial_ends_at");

  if (error) throw error;

  const byStatus: Record<SubscriptionStatus, number> = {
    active: 0,
    past_due: 0,
    suspended: 0,
    cancelled: 0,
  };

  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  let trialsEndingSoon = 0;

  (companies ?? []).forEach((c) => {
    const status = (c.subscription_status ?? "active") as SubscriptionStatus;
    byStatus[status] = (byStatus[status] ?? 0) + 1;

    if (
      c.subscription_plan === "trial" &&
      c.trial_ends_at &&
      new Date(c.trial_ends_at) <= sevenDaysFromNow &&
      new Date(c.trial_ends_at) >= new Date()
    ) {
      trialsEndingSoon++;
    }
  });

  const { data: subscriptionPayments } = await supabase
    .from("payments")
    .select("amount")
    .eq("status", "completed")
    .eq("payment_type", "subscription");

  const totalSubscriptionRevenue =
    subscriptionPayments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

  return {
    totalCompanies: companies?.length ?? 0,
    byStatus,
    trialsEndingSoon,
    totalSubscriptionRevenue,
  };
}

export async function updateSubscriptionPlan(companyId: string, plan: SubscriptionPlan) {
  const { data: oldData } = await supabase
    .from("companies")
    .select("subscription_plan")
    .eq("id", companyId)
    .single();

  const { error } = await supabase
    .from("companies")
    .update({ subscription_plan: plan, updated_at: new Date().toISOString() })
    .eq("id", companyId);

  if (error) throw error;

  await logAudit("subscription_plan_changed", companyId, oldData, { subscription_plan: plan });
}

export async function updateSubscriptionStatus(
  companyId: string,
  status: SubscriptionStatus,
  reason?: string
) {
  const { data: oldData } = await supabase
    .from("companies")
    .select("subscription_status, suspended_reason, is_active")
    .eq("id", companyId)
    .single();

  const updates: Record<string, unknown> = {
    subscription_status: status,
    updated_at: new Date().toISOString(),
  };

  if (status === "suspended") {
    updates.is_active = false;
    updates.suspended_at = new Date().toISOString();
    updates.suspended_reason = reason || "Haikutolewa sababu";
  } else if (status === "active") {
    updates.is_active = true;
    updates.suspended_at = null;
    updates.suspended_reason = null;
  }

  const { error } = await supabase.from("companies").update(updates).eq("id", companyId);
  if (error) throw error;

  await logAudit("subscription_status_changed", companyId, oldData, updates);
}