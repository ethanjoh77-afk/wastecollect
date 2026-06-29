import { supabase } from "./supabase";

export async function uploadReportPhoto(file: File) {
  const fileExt = file.name.split(".").pop();

  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}.${fileExt}`;

  const filePath = `reports/${fileName}`;

  const { error } = await supabase.storage
    .from("report-photos")
    .upload(filePath, file);

  if (error) {
    throw error;
  }

  const { data } = supabase.storage
    .from("report-photos")
    .getPublicUrl(filePath);

  return data.publicUrl;
}