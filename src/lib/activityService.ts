import { supabase } from "./supabase";

export type ActivityType =
  | "report"
  | "payment"
  | "collection"
  | "alert"
  | "success";

export interface CreateActivityInput {
  type: ActivityType;
  title: string;
  description: string;
  user_id?: string;
  role?: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  user_id?: string;
  role?: string;
  created_at: string;
}

/**
 * Create a new activity log (REAL Supabase insert)
 */
export async function createActivity(payload: CreateActivityInput) {
  const { data, error } = await supabase
    .from("activities")
    .insert({
      ...payload,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Activity insert failed:", error.message);
    return null;
  }

  return data;
}

/**
 * Fetch latest activities
 */
export async function getActivities(limit = 10): Promise<Activity[]> {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Fetch activities failed:", error.message);
    return [];
  }

  return data || [];
}