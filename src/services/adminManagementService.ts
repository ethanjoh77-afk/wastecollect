import { supabase } from "../lib/supabase";
import type { User } from "../types";

export interface AdminWithRelations extends User {
  company_name?: string;
  municipality_name?: string;
}

export interface CreateAdminInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: "company_admin" | "municipality_admin";
  company_id?: string;
  municipality_id?: string;
}

async function logAudit(
  action: string,
  tableName: string,
  recordId: string,
  oldValues?: object | null,
  newValues?: object | null
) {
  try {
    const { data: authData } = await supabase.auth.getUser();
    await supabase.from("audit_logs").insert({
      user_id: authData.user?.id,
      action,
      table_name: tableName,
      record_id: recordId,
      old_values: oldValues ?? null,
      new_values: newValues ?? null,
    });
  } catch (err) {
    console.error("Imeshindikana kuandika audit log:", err);
  }
}

export async function getAdmins(): Promise<AdminWithRelations[]> {
  const [usersRes, companiesRes, municipalitiesRes] = await Promise.all([
    supabase
      .from("users")
      .select("*")
      .in("role", ["company_admin", "municipality_admin"])
      .order("created_at", { ascending: false }),
    supabase.from("companies").select("id, name, admin_id"),
    supabase.from("municipalities").select("id, name, admin_id"),
  ]);

  if (usersRes.error) throw usersRes.error;

  const companyByAdmin = new Map(
    (companiesRes.data ?? []).filter((c) => c.admin_id).map((c) => [c.admin_id, c.name])
  );
  const municipalityByAdmin = new Map(
    (municipalitiesRes.data ?? []).filter((m) => m.admin_id).map((m) => [m.admin_id, m.name])
  );

  return (usersRes.data ?? []).map((u) => ({
    ...u,
    company_name: companyByAdmin.get(u.id),
    municipality_name: municipalityByAdmin.get(u.id),
  }));
}

/**
 * Inaita Edge Function 'create-admin-user' — LAZIMA itumike kwa sababu
 * kuunda auth account kwa niaba ya mtu mwingine hakuwezi kufanywa kwa
 * usalama kutoka browser (anon key). Function hutumia service_role
 * upande wa server pekee.
 */
export async function createAdmin(input: CreateAdminInput) {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    throw new Error("Session imeisha. Tafadhali ingia tena.");
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const response = await fetch(`${supabaseUrl}/functions/v1/create-admin-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Imeshindikana kuunda akaunti ya msimamizi");
  }

  await logAudit("admin_created", "users", result.user.id, null, {
    email: input.email,
    role: input.role,
  });

  return result.user;
}

export async function updateAdminStatus(id: string, isActive: boolean) {
  const { data: oldData } = await supabase.from("users").select("*").eq("id", id).single();

  const { data, error } = await supabase
    .from("users")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  await logAudit(isActive ? "admin_activated" : "admin_deactivated", "users", id, oldData, data);
  return data;
}

export async function deleteAdmin(id: string) {
  const { data: oldData } = await supabase.from("users").select("*").eq("id", id).single();

  // Ondoa uhusiano na kampuni/manispaa kabla ya kufuta
  await supabase.from("companies").update({ admin_id: null }).eq("admin_id", id);
  await supabase.from("municipalities").update({ admin_id: null }).eq("admin_id", id);

  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) throw error;

  await logAudit("admin_deleted", "users", id, oldData, null);
}

export async function getUnassignedCompanies() {
  const { data, error } = await supabase
    .from("companies")
    .select("id, name")
    .is("admin_id", null)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getUnassignedMunicipalities() {
  const { data, error } = await supabase
    .from("municipalities")
    .select("id, name")
    .is("admin_id", null)
    .order("name");
  if (error) throw error;
  return data ?? [];
}