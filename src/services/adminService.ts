import { supabase } from "../lib/supabase";

export async function getAdminStats() {
  const [
    usersResult,
    reportsResult,
    vehiclesResult,
    activitiesResult,
    paymentsResult,
  ] = await Promise.all([
    supabase
      .from("users")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("waste_reports")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("vehicles")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("activities")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("payments")
      .select("amount"),
  ]);

  const revenue =
    paymentsResult.data?.reduce(
      (sum, item) => sum + Number(item.amount),
      0
    ) || 0;

  return {
    users: usersResult.count || 0,
    reports: reportsResult.count || 0,
    vehicles: vehiclesResult.count || 0,
    activities: activitiesResult.count || 0,
    revenue,
  };
}