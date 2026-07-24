import { supabase } from "../lib/supabase";

export interface ScheduleEntry {
  id: string;
  zone_id: string;
  zone_name: string;
  collection_day: string;
  start_time?: string;
  end_time?: string;
  frequency?: string;
  waste_category_name?: string;
  waste_category_color?: string;
  waste_category_icon?: string;
}

const DAY_ORDER: Record<string, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
};

function sortByDay(a: ScheduleEntry, b: ScheduleEntry) {
  const da = DAY_ORDER[a.collection_day?.toLowerCase()] ?? 99;
  const db = DAY_ORDER[b.collection_day?.toLowerCase()] ?? 99;
  if (da !== db) return da - db;
  return (a.start_time ?? "").localeCompare(b.start_time ?? "");
}

/**
 * Hupata ratiba ya mwananchi kulingana na `ward_id` yake (kutoka jedwali `citizens`).
 * Kama mwananchi hana ward iliyowekwa, inarudisha ratiba ya manispaa yake nzima
 * (fallback), pamoja na alama `isPersonalized: false` ili UI iweze kumjulisha.
 */
export async function getMySchedule(): Promise<{
  schedules: ScheduleEntry[];
  isPersonalized: boolean;
  wardName?: string;
}> {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) throw new Error("Session imeisha. Tafadhali ingia tena.");

  const { data: citizen } = await supabase
    .from("citizens")
    .select("ward_id, municipality_id")
    .eq("user_id", userId)
    .maybeSingle();

  let zoneQuery = supabase
    .from("collection_zones")
    .select("id, name, ward_id, municipality_id")
    .eq("is_active", true);

  let isPersonalized = false;
  let wardName: string | undefined;

  if (citizen?.ward_id) {
    zoneQuery = zoneQuery.eq("ward_id", citizen.ward_id);
    isPersonalized = true;
    const { data: ward } = await supabase
      .from("wards")
      .select("name")
      .eq("id", citizen.ward_id)
      .maybeSingle();
    wardName = ward?.name;
  } else if (citizen?.municipality_id) {
    zoneQuery = zoneQuery.eq("municipality_id", citizen.municipality_id);
  }

  const { data: zones, error: zonesError } = await zoneQuery;
  if (zonesError) throw zonesError;

  if (!zones || zones.length === 0) {
    return { schedules: [], isPersonalized, wardName };
  }

  const zoneIds = zones.map((z) => z.id);
  const zoneNameMap = new Map(zones.map((z) => [z.id, z.name]));

  const { data: schedules, error: schedulesError } = await supabase
    .from("collection_schedules")
    .select("*")
    .in("zone_id", zoneIds)
    .eq("is_active", true);
  if (schedulesError) throw schedulesError;

  const categoryIds = Array.from(
    new Set((schedules ?? []).map((s) => s.waste_category_id).filter(Boolean))
  );
  const categoryMap = new Map<string, { name: string; color?: string; icon?: string }>();
  if (categoryIds.length > 0) {
    const { data: categories } = await supabase
      .from("waste_categories")
      .select("id, name, color, icon")
      .in("id", categoryIds);
    (categories ?? []).forEach((c) => categoryMap.set(c.id, c));
  }

  const result: ScheduleEntry[] = (schedules ?? []).map((s) => ({
    id: s.id,
    zone_id: s.zone_id,
    zone_name: zoneNameMap.get(s.zone_id) ?? "—",
    collection_day: s.collection_day,
    start_time: s.start_time,
    end_time: s.end_time,
    waste_category_name: s.waste_category_id ? categoryMap.get(s.waste_category_id)?.name : undefined,
    waste_category_color: s.waste_category_id ? categoryMap.get(s.waste_category_id)?.color : undefined,
    waste_category_icon: s.waste_category_id ? categoryMap.get(s.waste_category_id)?.icon : undefined,
  }));

  result.sort(sortByDay);

  return { schedules: result, isPersonalized, wardName };
}

/** Ratiba inayofuata (siku ya karibuni zaidi kuanzia leo) — kwa Dashboard "Next Collection" card. */
export function getNextSchedule(schedules: ScheduleEntry[]): ScheduleEntry | null {
  if (schedules.length === 0) return null;

  const todayIndex = new Date().getDay(); // 0=Sunday..6=Saturday
  const todayOrder = todayIndex === 0 ? 7 : todayIndex; // align to Monday=1..Sunday=7

  const upcoming = schedules
    .map((s) => ({ entry: s, order: DAY_ORDER[s.collection_day?.toLowerCase()] ?? 99 }))
    .filter((s) => s.order >= todayOrder)
    .sort((a, b) => a.order - b.order);

  if (upcoming.length > 0) return upcoming[0].entry;
  return schedules[0]; // wiki ijayo, siku ya kwanza kwenye orodha
}