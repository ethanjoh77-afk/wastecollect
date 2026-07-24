import { supabase } from "../lib/supabase";

export interface WasteCategory {
  id: string;
  name: string;
  code?: string;
  description?: string;
  icon?: string;
  color?: string;
  disposal_instructions?: string;
  is_recyclable: boolean;
  is_hazardous: boolean;
  points_per_kg: number;
}

export interface RecyclingCenter {
  id: string;
  name: string;
  address?: string;
  location_lat?: number;
  location_lng?: number;
  accepted_categories?: string[];
  contact_phone?: string;
  contact_email?: string;
}

export interface RecyclingRecord {
  id: string;
  citizen_id: string;
  waste_category_id: string;
  category_name?: string;
  quantity_kg: number;
  points_earned: number;
  recycling_center_id?: string;
  center_name?: string;
  verified_by?: string;
  created_at: string;
}

export interface RecyclingStats {
  totalKg: number;
  totalPoints: number;
  totalSubmissions: number;
  byCategory: { category_name: string; kg: number; points: number }[];
}

/** Only categories actually marked recyclable — real flag from the DB, not a hardcoded list. */
export async function getRecyclableCategories(): Promise<WasteCategory[]> {
  const { data, error } = await supabase
    .from("waste_categories")
    .select("*")
    .eq("is_recyclable", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getRecyclingCenters(): Promise<RecyclingCenter[]> {
  const { data, error } = await supabase.from("recycling_centers").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getMyRecyclingRecords(): Promise<RecyclingRecord[]> {
  const { data: authData } = await supabase.auth.getUser();
  const citizenId = authData.user?.id;
  if (!citizenId) throw new Error("Umeondoka kwenye mfumo. Tafadhali ingia tena.");

  const { data, error } = await supabase
    .from("recycling_records")
    .select(
      "*, waste_categories:waste_category_id ( name ), recycling_centers:recycling_center_id ( name )"
    )
    .eq("citizen_id", citizenId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((r: any) => ({
    ...r,
    category_name: r.waste_categories?.name,
    center_name: r.recycling_centers?.name,
  }));
}

export async function getMyRecyclingStats(): Promise<RecyclingStats> {
  const records = await getMyRecyclingRecords();

  const byCategoryMap = new Map<string, { kg: number; points: number }>();
  let totalKg = 0;
  let totalPoints = 0;

  for (const r of records) {
    totalKg += Number(r.quantity_kg);
    totalPoints += Number(r.points_earned);
    const key = r.category_name ?? "Nyingine";
    const existing = byCategoryMap.get(key) ?? { kg: 0, points: 0 };
    existing.kg += Number(r.quantity_kg);
    existing.points += Number(r.points_earned);
    byCategoryMap.set(key, existing);
  }

  return {
    totalKg,
    totalPoints,
    totalSubmissions: records.length,
    byCategory: Array.from(byCategoryMap.entries()).map(([category_name, v]) => ({
      category_name,
      ...v,
    })),
  };
}

export interface LogRecyclingInput {
  waste_category_id: string;
  quantity_kg: number;
  recycling_center_id?: string;
}

/**
 * Logs a recycling submission. Points are computed from the category's
 * real `points_per_kg` rate stored in the database — never hardcoded here.
 */
export async function logRecycling(input: LogRecyclingInput): Promise<RecyclingRecord> {
  const { data: authData } = await supabase.auth.getUser();
  const citizenId = authData.user?.id;
  if (!citizenId) throw new Error("Umeondoka kwenye mfumo. Tafadhali ingia tena.");

  const { data: category, error: categoryError } = await supabase
    .from("waste_categories")
    .select("points_per_kg")
    .eq("id", input.waste_category_id)
    .single();
  if (categoryError) throw categoryError;

  const pointsEarned = Math.round(Number(category.points_per_kg) * input.quantity_kg);

  const { data, error } = await supabase
    .from("recycling_records")
    .insert({
      citizen_id: citizenId,
      waste_category_id: input.waste_category_id,
      quantity_kg: input.quantity_kg,
      points_earned: pointsEarned,
      recycling_center_id: input.recycling_center_id || null,
    })
    .select()
    .single();
  if (error) throw error;

  await supabase.from("audit_logs").insert({
    user_id: citizenId,
    action: "recycling.logged",
    table_name: "recycling_records",
    record_id: data.id,
    new_values: { quantity_kg: input.quantity_kg, points_earned: pointsEarned },
  });

  return data;
}
