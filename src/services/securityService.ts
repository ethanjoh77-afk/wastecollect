import { supabase } from "../lib/supabase";
import type { UserRole } from "../types";

const SECURITY_ACTIONS = [
  "admin_created",
  "admin_deactivated",
  "admin_activated",
  "admin_deleted",
  "company_suspended",
  "company_activated",
  "subscription_status_updated",
  "notification_sent",
  "ticket_assigned",
];

export interface SecurityEvent {
  id: string;
  user_id?: string;
  action: string;
  table_name?: string;
  record_id?: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

export interface OtpActivity {
  id: string;
  user_id?: string;
  type: string;
  is_used: boolean;
  expires_at: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

export interface AccountOverview {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  last_login?: string;
  created_at: string;
}

async function attachUserInfo<T extends { user_id?: string }>(rows: T[]) {
  const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean))) as string[];
  const usersById = new Map<string, { name: string; email: string }>();
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, first_name, last_name, email")
      .in("id", userIds);
    (users ?? []).forEach((u) => {
      usersById.set(u.id, { name: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email, email: u.email });
    });
  }
  return rows.map((r) => ({
    ...r,
    user_name: r.user_id ? usersById.get(r.user_id)?.name : undefined,
    user_email: r.user_id ? usersById.get(r.user_id)?.email : undefined,
  }));
}

export async function getSecurityEvents(limit = 100): Promise<SecurityEvent[]> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .in("action", SECURITY_ACTIONS)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return attachUserInfo(data ?? []);
}

export async function getRecentOtpActivity(limit = 100): Promise<OtpActivity[]> {
  const { data, error } = await supabase
    .from("otp_codes")
    .select("id, user_id, type, is_used, expires_at, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return attachUserInfo(data ?? []);
}

export async function getAccountsOverview(): Promise<AccountOverview[]> {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, first_name, last_name, role, is_active, is_verified, last_login, created_at")
    .order("last_login", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function setAccountActive(userId: string, isActive: boolean) {
  const { data: authData } = await supabase.auth.getUser();
  const { data: oldData } = await supabase.from("users").select("*").eq("id", userId).single();

  const { data, error } = await supabase
    .from("users")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;

  await supabase.from("audit_logs").insert({
    user_id: authData.user?.id,
    action: isActive ? "account_reactivated" : "account_deactivated",
    table_name: "users",
    record_id: userId,
    old_values: oldData,
    new_values: data,
  });

  return data;
}
