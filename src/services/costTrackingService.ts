import { supabase } from '../lib/supabase';

/**
 * Fuel & cost tracking — inaziba pengo lililobainika dhidi ya Swali #6/#8
 * ("What does WasteCollect provide that a weighbridge doesn't?" /
 * "Can we prove measurable ROI within 30 days?"). Kabla ya hii, hapakuwa
 * na njia yoyote ya kupima gharama ya route au ya pickup moja.
 */

export interface FuelLogInput {
  company_id: string;
  vehicle_id: string;
  route_id?: string | null;
  liters: number;
  cost_amount: number;
  odometer_km?: number | null;
  notes?: string | null;
}

export interface FuelLog extends FuelLogInput {
  id: string;
  logged_by: string | null;
  logged_at: string;
  created_at: string;
}

export async function createFuelLog(input: FuelLogInput): Promise<FuelLog> {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id ?? null;

  const { data, error } = await supabase
    .from('fuel_logs')
    .insert({ ...input, logged_by: userId })
    .select()
    .single();

  if (error) throw error;
  return data as FuelLog;
}

export async function listFuelLogs(companyId: string, limit = 50): Promise<FuelLog[]> {
  const { data, error } = await supabase
    .from('fuel_logs')
    .select('*')
    .eq('company_id', companyId)
    .order('logged_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as FuelLog[];
}

export interface RouteCostSummary {
  route_id: string;
  company_id: string;
  route_name: string | null;
  scheduled_date: string | null;
  total_stops: number | null;
  status: string;
  total_fuel_cost: number;
  total_liters: number;
  completed_stops: number;
  skipped_stops: number;
  cost_per_completed_pickup: number | null;
}

/** Inasoma `route_cost_summary` view iliyoongezwa na migration 004. */
export async function getRouteCostSummaries(companyId: string): Promise<RouteCostSummary[]> {
  const { data, error } = await supabase
    .from('route_cost_summary')
    .select('*')
    .eq('company_id', companyId)
    .order('scheduled_date', { ascending: false });

  if (error) throw error;
  return (data ?? []) as RouteCostSummary[];
}

export interface CompanyOperationalKpis {
  totalFuelCostThisMonth: number;
  totalPickupsThisMonth: number;
  averageCostPerPickup: number | null;
  missedPickupRate: number | null;
}

/**
 * Muhtasari mmoja unaojibu moja kwa moja Swali #8: "Je tunaweza ku-prove
 * value ndani ya siku 30?" — hii ndiyo namba za kuonyesha kwa pilot customer.
 */
export async function getCompanyOperationalKpis(companyId: string): Promise<CompanyOperationalKpis> {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [fuelRes, stopsRes, reportsRes] = await Promise.all([
    supabase
      .from('fuel_logs')
      .select('cost_amount')
      .eq('company_id', companyId)
      .gte('logged_at', monthStart.toISOString()),
    supabase
      .from('route_stops')
      .select('status, routes:route_id!inner(company_id)')
      .eq('routes.company_id', companyId),
    supabase
      .from('waste_reports')
      .select('report_type')
      .eq('report_type', 'missed_collection'),
  ]);

  const totalFuelCostThisMonth = (fuelRes.data ?? []).reduce(
    (sum: number, row: { cost_amount: number }) => sum + Number(row.cost_amount ?? 0),
    0
  );

  const stops = (stopsRes.data ?? []) as { status: string }[];
  const completedStops = stops.filter((s) => s.status === 'completed').length;
  const skippedStops = stops.filter((s) => s.status === 'skipped').length;
  const totalPickupsThisMonth = completedStops;

  const averageCostPerPickup = completedStops > 0 ? Number((totalFuelCostThisMonth / completedStops).toFixed(2)) : null;

  const missedPickupRate =
    completedStops + skippedStops > 0 ? Number(((skippedStops / (completedStops + skippedStops)) * 100).toFixed(1)) : null;

  return {
    totalFuelCostThisMonth,
    totalPickupsThisMonth,
    averageCostPerPickup,
    missedPickupRate,
  };

  // reportsRes inabaki kwa matumizi ya baadaye (breakdown ya missed-collection
  // reports kwa municipality), haijatumika kwenye hesabu hii ili tuepuke
  // kuchanganya "ripoti za wananchi" na "route_stops halisi" bila uhakika
  // wa uhusiano wa moja kwa moja.
  void reportsRes;
}
