import { supabase } from "../lib/supabase";

export async function createActivity(payload: {
  type: "collection" | "report" | "payment" | "alert" | "success";
  title: string;
  description: string;
  user_id?: string;
  role?: string;
}) {
  const { error } = await supabase.from("activities").insert(payload);

  if (error) {
    console.error("Activity insert failed:", error);
  }
}