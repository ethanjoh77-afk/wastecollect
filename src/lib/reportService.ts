import { supabase } from "./supabase";

export interface WasteReport {
  id: string;
  citizen_id: string;
  report_type: string;
  description: string | null;
  address: string | null;
  status: string | null;
  created_at: string;
}

export async function getUserReports(userId: string) {
  const { data, error } = await supabase
    .from("waste_reports")
    .select("*")
    .eq("citizen_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    throw error;
  }

  return (data ?? []) as WasteReport[];
}