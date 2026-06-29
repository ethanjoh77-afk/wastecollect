import { supabase } from "../lib/supabase";
import type { Complaint } from "../types/complaints.types";

export async function createComplaint(
  payload: Omit<
    Complaint,
    "id" | "created_at" | "updated_at" | "resolved_at"
  >
) {
  const { data, error } = await supabase
    .from("complaints")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function getComplaints() {
  const { data, error } = await supabase
    .from("complaints")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data as Complaint[];
}