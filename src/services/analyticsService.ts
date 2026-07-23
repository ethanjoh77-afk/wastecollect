import { supabase } from "../lib/supabase";

export interface MonthPoint {
  name: string;
  value: number;
}

export interface PlatformOverview {
  totalUsers: number;
  totalCompanies: number;
  activeCompanies: number;
  totalMunicipalities: number;
  paymentsTotalCompleted: number;
  paymentsTotalPending: number;
  usersByRole: Record<string, number>;
  complaintsByStatus: Record<string, number>;
  vehiclesByStatus: Record<string, number>;
  routesByStatus: Record<string, number>;
}

function countBy<T extends string>(rows: { field: T }[] | null): Record<string, number> {
  const result: Record<string, number> = {};
  (rows ?? []).forEach((r) => {
    result[r.field] = (result[r.field] ?? 0) + 1;
  });
  return result;
}

export async function getPlatformOverview(): Promise<PlatformOverview> {
  const [
    usersRes,
    companiesRes,
    municipalitiesRes,
    paymentsCompletedRes,
    paymentsPendingRes,
    complaintsRes,
    vehiclesRes,
    routesRes,
  ] = await Promise.all([
    supabase.from("users").select("role"),
    supabase.from("companies").select("is_active"),
    supabase.from("municipalities").select("id", { count: "exact", head: true }),
    supabase.from("payments").select("amount").eq("status", "completed"),
    supabase.from("payments").select("amount").eq("status", "pending"),
    supabase.from("complaints").select("status"),
    supabase.from("vehicles").select("status"),
    supabase.from("routes").select("status"),
  ]);

  const usersByRole = countBy((usersRes.data ?? []).map((u) => ({ field: u.role })));
  const complaintsByStatus = countBy((complaintsRes.data ?? []).map((c) => ({ field: c.status })));
  const vehiclesByStatus = countBy((vehiclesRes.data ?? []).map((v) => ({ field: v.status })));
  const routesByStatus = countBy((routesRes.data ?? []).map((r) => ({ field: r.status })));

  const totalCompanies = companiesRes.data?.length ?? 0;
  const activeCompanies = (companiesRes.data ?? []).filter((c) => c.is_active).length;

  const paymentsTotalCompleted =
    paymentsCompletedRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;
  const paymentsTotalPending =
    paymentsPendingRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

  return {
    totalUsers: usersRes.data?.length ?? 0,
    totalCompanies,
    activeCompanies,
    totalMunicipalities: municipalitiesRes.count ?? 0,
    paymentsTotalCompleted,
    paymentsTotalPending,
    usersByRole,
    complaintsByStatus,
    vehiclesByStatus,
    routesByStatus,
  };
}

function lastNMonthLabels(n: number): { key: string; label: string }[] {
  const months: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "short" });
    months.push({ key, label });
  }
  return months;
}

export async function getUserSignupTrend(months: number): Promise<MonthPoint[]> {
  const monthList = lastNMonthLabels(months);
  const earliest = new Date();
  earliest.setMonth(earliest.getMonth() - (months - 1));
  earliest.setDate(1);

  const { data } = await supabase
    .from("users")
    .select("created_at")
    .gte("created_at", earliest.toISOString());

  const counts: Record<string, number> = {};
  (data ?? []).forEach((u) => {
    const d = new Date(u.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    counts[key] = (counts[key] ?? 0) + 1;
  });

  return monthList.map((m) => ({ name: m.label, value: counts[m.key] ?? 0 }));
}

export async function getRevenueTrend(months: number): Promise<MonthPoint[]> {
  const monthList = lastNMonthLabels(months);
  const earliest = new Date();
  earliest.setMonth(earliest.getMonth() - (months - 1));
  earliest.setDate(1);

  const { data } = await supabase
    .from("payments")
    .select("amount, created_at")
    .eq("status", "completed")
    .gte("created_at", earliest.toISOString());

  const totals: Record<string, number> = {};
  (data ?? []).forEach((p) => {
    const d = new Date(p.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    totals[key] = (totals[key] ?? 0) + Number(p.amount);
  });

  return monthList.map((m) => ({ name: m.label, value: totals[m.key] ?? 0 }));
}