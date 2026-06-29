import { supabase } from "../lib/supabase";

export async function getSection(section: string) {
  const { data, error } = await supabase
    .from("landing_content")
    .select("*")
    .eq("section", section);

  if (error) throw error;
  return data;
}

export async function updateContent(id: string, payload: any) {
  const { data, error } = await supabase
    .from("landing_content")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
  return data;
}