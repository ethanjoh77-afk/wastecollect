import { supabase } from "./supabase";

export async function getLandingStats() {
  // USERS COUNT
  const { count: users } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });

  // PAYMENTS TOTAL + COUNT
  const { data: payments } = await supabase
    .from("payments")
    .select("amount");

  const totalRevenue =
    payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  // REPORTS COUNT
  const { count: reports } = await supabase
    .from("waste_reports")
    .select("*", { count: "exact", head: true });

  // TRUCKS COUNT (optional table)
  const { count: trucks } = await supabase
    .from("vehicles")
    .select("*", { count: "exact", head: true });

  return {
    users: users || 0,
    revenue: totalRevenue,
    reports: reports || 0,
    trucks: trucks || 0,
  };
}