import { supabase } from "../lib/supabase";

export interface ScopedAnalytics {
  scopeType: "company" | "municipality" | "unscoped";
  scopeName?: string;
  driverCount: number;
  vehicleCount: number;
  vehiclesByStatus: Record<string, number>;
  routesByStatus: Record<string, number>;
  complaintCount: number;
  complaintsByStatus: Record<string, number>;
  completedCollections: number;
  /** Only populated for municipality scope — payments are tracked per
   * municipality in the schema, not per company, so company-scoped
   * revenue cannot be computed honestly without fabricating a link. */
  revenueTotal: number | null;
}

function countBy(rows: { status: string }[] | null): Record<string, number> {
  const result: Record<string, number> = {};
  (rows ?? []).forEach((r) => {
    result[r.status] = (result[r.status] ?? 0) + 1;
  });
  return result;
}

/**
 * Resolves the logged-in admin's own company or municipality (via the
 * admin_id reverse link already used elsewhere in the app), then returns
 * real, scoped operational statistics — never platform-wide numbers.
 */
export async function getMyScopedAnalytics(): Promise<ScopedAnalytics> {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) throw new Error("Umeondoka kwenye mfumo. Tafadhali ingia tena.");

  const { data: profile } = await supabase.from("users").select("role").eq("id", userId).single();

  if (profile?.role === "company_admin") {
    const { data: company } = await supabase
      .from("companies")
      .select("id, name")
      .eq("admin_id", userId)
      .maybeSingle();

    if (!company) {
      return emptyScope("company");
    }

    const [driversRes, vehiclesRes, routesRes] = await Promise.all([
      supabase.from("drivers").select("*", { count: "exact", head: true }).eq("company_id", company.id),
      supabase.from("vehicles").select("status").eq("company_id", company.id),
      supabase.from("routes").select("status").eq("company_id", company.id),
    ]);

    const routesByStatus = countBy(routesRes.data ?? []);

    return {
      scopeType: "company",
      scopeName: company.name,
      driverCount: driversRes.count ?? 0,
      vehicleCount: vehiclesRes.data?.length ?? 0,
      vehiclesByStatus: countBy(vehiclesRes.data ?? []),
      routesByStatus,
      complaintCount: 0,
      complaintsByStatus: {},
      completedCollections: routesByStatus.completed ?? 0,
      revenueTotal: null,
    };
  }

  if (profile?.role === "municipality_admin") {
    const { data: municipality } = await supabase
      .from("municipalities")
      .select("id, name")
      .eq("admin_id", userId)
      .maybeSingle();

    if (!municipality) {
      return emptyScope("municipality");
    }

    const [complaintsRes, paymentsRes] = await Promise.all([
      supabase.from("complaints").select("status"),
      supabase
        .from("payments")
        .select("amount")
        .eq("municipality_id", municipality.id)
        .eq("status", "completed"),
    ]);

    const revenueTotal = (paymentsRes.data ?? []).reduce((sum, p: any) => sum + Number(p.amount), 0);

    return {
      scopeType: "municipality",
      scopeName: municipality.name,
      driverCount: 0,
      vehicleCount: 0,
      vehiclesByStatus: {},
      routesByStatus: {},
      complaintCount: complaintsRes.data?.length ?? 0,
      complaintsByStatus: countBy(complaintsRes.data ?? []),
      completedCollections: 0,
      revenueTotal,
    };
  }

  return emptyScope("unscoped");
}

function emptyScope(scopeType: ScopedAnalytics["scopeType"]): ScopedAnalytics {
  return {
    scopeType,
    driverCount: 0,
    vehicleCount: 0,
    vehiclesByStatus: {},
    routesByStatus: {},
    complaintCount: 0,
    complaintsByStatus: {},
    completedCollections: 0,
    revenueTotal: null,
  };
}
