import { supabase } from "../lib/supabase";
import type { PlatformStats } from "../types";

export async function getPlatformStats(): Promise<PlatformStats> {
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  const [
    companies,
    citizens,
    drivers,
    municipalityAdmins,
    companyAdmins,
    requests,
    paymentsCompleted,
    pendingComplaints,
    completedRoutes,
    activeVehicles,
    onlineUsers,
  ] = await Promise.all([
    supabase.from("companies").select("*", { count: "exact", head: true }),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "citizen"),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "driver"),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "municipality_admin"),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "company_admin"),
    supabase.from("waste_reports").select("*", { count: "exact", head: true }),
    supabase.from("payments").select("amount").eq("status", "completed"),
    supabase.from("complaints").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("routes").select("*", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("vehicles").select("*", { count: "exact", head: true }).in("status", ["available", "on_route"]),
    supabase.from("users").select("*", { count: "exact", head: true }).gte("last_login", fifteenMinAgo),
  ]);

  const totalRevenue =
    paymentsCompleted.data?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

  return {
    totalCompanies: companies.count ?? 0,
    totalCitizens: citizens.count ?? 0,
    totalDrivers: drivers.count ?? 0,
    totalAdmins: (municipalityAdmins.count ?? 0) + (companyAdmins.count ?? 0),
    totalRequests: requests.count ?? 0,
    totalPayments: paymentsCompleted.data?.length ?? 0,
    totalRevenue,
    pendingComplaints: pendingComplaints.count ?? 0,
    completedCollections: completedRoutes.count ?? 0,
    activeVehicles: activeVehicles.count ?? 0,
    onlineUsers: onlineUsers.count ?? 0,
  };
}

/**
 * Hupima muda halisi wa majibu wa database (si namba ya kubuni).
 * Kwa kuwa mfumo hauna server tofauti (Supabase ndiyo backend),
 * hii ndiyo kipimo cha kweli cha "System Health" tunachoweza kupata.
 */
export async function getDatabaseHealth(): Promise<{
  status: "operational" | "degraded" | "down";
  latencyMs: number;
}> {
  const start = performance.now();
  try {
    const { error } = await supabase.from("users").select("id", { head: true, count: "exact" }).limit(1);
    const latencyMs = Math.round(performance.now() - start);

    if (error) return { status: "down", latencyMs };
    if (latencyMs > 1500) return { status: "degraded", latencyMs };
    return { status: "operational", latencyMs };
  } catch {
    return { status: "down", latencyMs: Math.round(performance.now() - start) };
  }
}