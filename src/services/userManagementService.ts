import { supabase } from '../lib/supabase';
import type { User, UserRole, Citizen, Driver } from '../types';

export interface UserListFilters {
  role?: UserRole | '';
  search?: string;
  isActive?: 'all' | 'active' | 'inactive';
  page?: number;
  pageSize?: number;
}

export interface UserListResult {
  users: User[];
  total: number;
}

/** Paginated, filterable list of ALL platform users (any role). */
export async function listUsers(filters: UserListFilters = {}): Promise<UserListResult> {
  const { role, search, isActive = 'all', page = 1, pageSize = 20 } = filters;

  let query = supabase
    .from('users')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (role) query = query.eq('role', role);
  if (isActive === 'active') query = query.eq('is_active', true);
  if (isActive === 'inactive') query = query.eq('is_active', false);
  if (search && search.trim()) {
    const q = search.trim();
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return { users: data ?? [], total: count ?? 0 };
}

export interface UserDetail extends User {
  citizenProfile?: Citizen;
  driverProfile?: Driver & { company_name?: string; vehicle_registration?: string };
}

/** Full profile for one user, including their role-specific record (citizen/driver). */
export async function getUserDetail(userId: string): Promise<UserDetail> {
  const { data: user, error } = await supabase.from('users').select('*').eq('id', userId).single();
  if (error) throw error;

  const detail: UserDetail = { ...user };

  if (user.role === 'citizen') {
    const { data: citizen } = await supabase
      .from('citizens')
      .select('*, wards:ward_id ( name ), municipalities:municipality_id ( name )')
      .eq('user_id', userId)
      .maybeSingle();
    if (citizen) detail.citizenProfile = citizen as unknown as Citizen;
  }

  if (user.role === 'driver') {
    const { data: driver } = await supabase
      .from('drivers')
      .select('*, companies:company_id ( name ), vehicles:assigned_vehicle_id ( registration_number )')
      .eq('user_id', userId)
      .maybeSingle();
    if (driver) {
      detail.driverProfile = {
        ...(driver as any),
        company_name: (driver as any).companies?.name,
        vehicle_registration: (driver as any).vehicles?.registration_number,
      };
    }
  }

  return detail;
}

async function writeAudit(action: string, recordId: string, extra?: Record<string, unknown>) {
  const { data: authData } = await supabase.auth.getUser();
  await supabase.from('audit_logs').insert({
    user_id: authData.user?.id,
    action,
    table_name: 'users',
    record_id: recordId,
    new_values: extra ?? null,
  });
}

/** Blocks a user (citizen, driver, admin — any role) with a recorded reason. */
export async function blockUser(userId: string, reason: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ is_active: false, blocked_at: new Date().toISOString(), blocked_reason: reason })
    .eq('id', userId);
  if (error) throw error;
  await writeAudit('user.block', userId, { reason });
}

/** Restores (reactivates) a previously blocked/deactivated user. */
export async function restoreUser(userId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ is_active: true, blocked_at: null, blocked_reason: null })
    .eq('id', userId);
  if (error) throw error;
  await writeAudit('user.restore', userId);
}

/** Quick counts per role for the User Management page header tiles. */
export async function getUserRoleCounts(): Promise<Record<UserRole, number>> {
  const roles: UserRole[] = ['citizen', 'driver', 'company_admin', 'municipality_admin', 'super_admin'];
  const results = await Promise.all(
    roles.map((role) => supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', role))
  );
  return roles.reduce((acc, role, i) => {
    acc[role] = results[i].count ?? 0;
    return acc;
  }, {} as Record<UserRole, number>);
}
