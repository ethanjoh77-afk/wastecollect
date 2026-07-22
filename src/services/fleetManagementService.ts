import { supabase } from '../lib/supabase';
import type { Vehicle, VehicleStatus } from '../types';

export interface VehicleListFilters {
  status?: VehicleStatus | '';
  companyId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface VehicleWithDetails extends Vehicle {
  company_name?: string;
  driver_name?: string;
}

export interface VehicleListResult {
  vehicles: VehicleWithDetails[];
  total: number;
}

export async function listVehicles(filters: VehicleListFilters = {}): Promise<VehicleListResult> {
  const { status, companyId, search, page = 1, pageSize = 20 } = filters;

  let query = supabase
    .from('vehicles')
    .select(
      `*, companies:company_id ( name ), driver:driver_id ( first_name, last_name )`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (companyId) query = query.eq('company_id', companyId);
  if (search && search.trim()) query = query.ilike('registration_number', `%${search.trim()}%`);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  const vehicles: VehicleWithDetails[] = (data ?? []).map((row: any) => ({
    ...row,
    company_name: row.companies?.name,
    driver_name: row.driver ? `${row.driver.first_name ?? ''} ${row.driver.last_name ?? ''}`.trim() : undefined,
  }));

  return { vehicles, total: count ?? 0 };
}

export interface VehicleDetail extends VehicleWithDetails {
  recentRoutes: { id: string; name?: string; status: string; created_at: string }[];
}

export async function getVehicleDetail(vehicleId: string): Promise<VehicleDetail> {
  const { data: vehicle, error } = await supabase
    .from('vehicles')
    .select(`*, companies:company_id ( name ), driver:driver_id ( first_name, last_name )`)
    .eq('id', vehicleId)
    .single();
  if (error) throw error;

  const { data: routes } = await supabase
    .from('routes')
    .select('id, name, status, created_at')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    ...(vehicle as any),
    company_name: (vehicle as any).companies?.name,
    driver_name: (vehicle as any).driver
      ? `${(vehicle as any).driver.first_name ?? ''} ${(vehicle as any).driver.last_name ?? ''}`.trim()
      : undefined,
    recentRoutes: routes ?? [],
  };
}

async function writeAudit(action: string, table: string, recordId: string, extra?: Record<string, unknown>) {
  const { data: authData } = await supabase.auth.getUser();
  await supabase.from('audit_logs').insert({
    user_id: authData.user?.id,
    action,
    table_name: table,
    record_id: recordId,
    new_values: extra ?? null,
  });
}

export interface CreateVehicleInput {
  company_id: string;
  registration_number: string;
  vehicle_type?: string;
  capacity_kg?: number;
  fuel_type?: string;
}

export async function createVehicle(input: CreateVehicleInput): Promise<Vehicle> {
  const { data, error } = await supabase
    .from('vehicles')
    .insert({ ...input, status: 'available', is_active: true })
    .select()
    .single();
  if (error) throw error;
  await writeAudit('vehicle.create', 'vehicles', data.id, input as Record<string, unknown>);
  return data;
}

export async function updateVehicle(vehicleId: string, updates: Partial<CreateVehicleInput>): Promise<void> {
  const { error } = await supabase.from('vehicles').update(updates).eq('id', vehicleId);
  if (error) throw error;
  await writeAudit('vehicle.update', 'vehicles', vehicleId, updates as Record<string, unknown>);
}

export async function setVehicleStatus(vehicleId: string, status: VehicleStatus): Promise<void> {
  const { error } = await supabase.from('vehicles').update({ status }).eq('id', vehicleId);
  if (error) throw error;
  await writeAudit('vehicle.status_change', 'vehicles', vehicleId, { status });
}

export async function deleteVehicle(vehicleId: string): Promise<void> {
  const { error } = await supabase.from('vehicles').delete().eq('id', vehicleId);
  if (error) throw error;
  await writeAudit('vehicle.delete', 'vehicles', vehicleId);
}

/** Drivers not currently assigned to a vehicle — for the "Assign Driver" dropdown. */
export async function listAvailableDrivers(companyId?: string) {
  let query = supabase
    .from('drivers')
    .select('user_id, company_id, users:user_id ( first_name, last_name )')
    .is('assigned_vehicle_id', null);

  if (companyId) query = query.eq('company_id', companyId);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    user_id: row.user_id,
    name: `${row.users?.first_name ?? ''} ${row.users?.last_name ?? ''}`.trim(),
  }));
}

export async function assignDriverToVehicle(vehicleId: string, driverUserId: string): Promise<void> {
  const { error: vehicleError } = await supabase
    .from('vehicles')
    .update({ driver_id: driverUserId })
    .eq('id', vehicleId);
  if (vehicleError) throw vehicleError;

  const { error: driverError } = await supabase
    .from('drivers')
    .update({ assigned_vehicle_id: vehicleId })
    .eq('user_id', driverUserId);
  if (driverError) throw driverError;

  await writeAudit('vehicle.assign_driver', 'vehicles', vehicleId, { driver_id: driverUserId });
}

export async function unassignDriver(vehicleId: string, driverUserId?: string): Promise<void> {
  const { error: vehicleError } = await supabase.from('vehicles').update({ driver_id: null }).eq('id', vehicleId);
  if (vehicleError) throw vehicleError;

  if (driverUserId) {
    await supabase.from('drivers').update({ assigned_vehicle_id: null }).eq('user_id', driverUserId);
  }

  await writeAudit('vehicle.unassign_driver', 'vehicles', vehicleId);
}
