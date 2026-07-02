import { supabase } from "./supabase";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function uploadReportPhoto(file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Aina ya faili haikubaliki. Tumia picha (JPEG, PNG, WEBP) pekee.");
  }

  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("Faili ni kubwa mno. Kiwango cha juu ni 5MB.");
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `reports/${fileName}`;

  const { error } = await supabase.storage
    .from("report-photos")
    .upload(filePath, file);

  if (error) {
    throw new Error("Imeshindwa kupakia picha. Tafadhali jaribu tena.");
  }

  const { data } = supabase.storage.from("report-photos").getPublicUrl(filePath);

  return data.publicUrl;
}