import { supabase } from "../lib/supabase";

export interface LiveVehicle {
  id: string;
  registration_number: string;
  vehicle_type?: string;
  status: string;
  current_latitude?: number;
  current_longitude?: number;
  last_location_update?: string;
  driver_name?: string;
  company_name?: string;
}

export interface LiveBinAlert {
  id: string;
  bin_code: string;
  fill_level: number;
  battery_level: number;
  temperature?: number;
  has_fire_alert: boolean;
  has_overflow_alert: boolean;
  location_lat?: number;
  location_lng?: number;
  last_emptied_at?: string;
}

export interface LiveRoute {
  id: string;
  name?: string;
  status: string;
  total_stops?: number;
  scheduled_date?: string;
  started_at?: string;
  driver_name?: string;
  vehicle_registration?: string;
}

export async function getLiveVehicles(): Promise<LiveVehicle[]> {
  const { data: vehicles, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("is_active", true)
    .order("last_location_update", { ascending: false });
  if (error) throw error;

  const driverIds = Array.from(new Set((vehicles ?? []).map((v) => v.driver_id).filter(Boolean)));
  const companyIds = Array.from(new Set((vehicles ?? []).map((v) => v.company_id).filter(Boolean)));

  const [driversRes, companiesRes] = await Promise.all([
    driverIds.length > 0
      ? supabase.from("users").select("id, first_name, last_name").in("id", driverIds)
      : Promise.resolve({ data: [], error: null }),
    companyIds.length > 0
      ? supabase.from("companies").select("id, name").in("id", companyIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const driverMap = new Map((driversRes.data ?? []).map((d) => [d.id, `${d.first_name ?? ""} ${d.last_name ?? ""}`.trim()]));
  const companyMap = new Map((companiesRes.data ?? []).map((c) => [c.id, c.name]));

  return (vehicles ?? []).map((v) => ({
    id: v.id,
    registration_number: v.registration_number,
    vehicle_type: v.vehicle_type,
    status: v.status,
    current_latitude: v.current_latitude,
    current_longitude: v.current_longitude,
    last_location_update: v.last_location_update,
    driver_name: v.driver_id ? driverMap.get(v.driver_id) : undefined,
    company_name: v.company_id ? companyMap.get(v.company_id) : undefined,
  }));
}

export async function getBinAlerts(): Promise<LiveBinAlert[]> {
  const { data, error } = await supabase
    .from("smart_bins")
    .select("*")
    .eq("is_active", true)
    .or("has_fire_alert.eq.true,has_overflow_alert.eq.true,fill_level.gte.80")
    .order("fill_level", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getAllBins(): Promise<LiveBinAlert[]> {
  const { data, error } = await supabase
    .from("smart_bins")
    .select("*")
    .eq("is_active", true)
    .order("fill_level", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getActiveRoutes(): Promise<LiveRoute[]> {
  const { data: routes, error } = await supabase
    .from("routes")
    .select("*")
    .in("status", ["pending", "in_progress"])
    .order("scheduled_date", { ascending: true });
  if (error) throw error;

  const driverIds = Array.from(new Set((routes ?? []).map((r) => r.driver_id).filter(Boolean)));
  const vehicleIds = Array.from(new Set((routes ?? []).map((r) => r.vehicle_id).filter(Boolean)));

  const [driversRes, vehiclesRes] = await Promise.all([
    driverIds.length > 0
      ? supabase.from("users").select("id, first_name, last_name").in("id", driverIds)
      : Promise.resolve({ data: [], error: null }),
    vehicleIds.length > 0
      ? supabase.from("vehicles").select("id, registration_number").in("id", vehicleIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const driverMap = new Map((driversRes.data ?? []).map((d) => [d.id, `${d.first_name ?? ""} ${d.last_name ?? ""}`.trim()]));
  const vehicleMap = new Map((vehiclesRes.data ?? []).map((v) => [v.id, v.registration_number]));

  return (routes ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    status: r.status,
    total_stops: r.total_stops,
    scheduled_date: r.scheduled_date,
    started_at: r.started_at,
    driver_name: r.driver_id ? driverMap.get(r.driver_id) : undefined,
    vehicle_registration: r.vehicle_id ? vehicleMap.get(r.vehicle_id) : undefined,
  }));
}
