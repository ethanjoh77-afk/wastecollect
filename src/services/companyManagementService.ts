import { supabase } from "../lib/supabase";
import type { Company } from "../types";

export interface CompanyWithRelations extends Company {
  municipality_name?: string;
  admin_name?: string;
  admin_email?: string;
}

export interface CompanyFormInput {
  name: string;
  registration_number: string;
  municipality_id: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  admin_id?: string | null;
  subscription_plan: "trial" | "standard" | "professional" | "enterprise";
  billing_email?: string;
}

/**
 * Andika kwenye audit_logs — muhimu kwa uwazi wa kila kitendo cha Super Admin.
 * Haizuii operesheni kuu isipofanikiwa (logging failure si sababu ya kufeli operesheni).
 */
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

export async function getCompanies(): Promise<CompanyWithRelations[]> {
  const [companiesRes, municipalitiesRes, adminsRes] = await Promise.all([
    supabase.from("companies").select("*").order("created_at", { ascending: false }),
    supabase.from("municipalities").select("id, name"),
    supabase.from("users").select("id, first_name, last_name, email").eq("role", "company_admin"),
  ]);

  if (companiesRes.error) throw companiesRes.error;

  const municipalityMap = new Map(
    (municipalitiesRes.data ?? []).map((m) => [m.id, m.name])
  );
  const adminMap = new Map(
    (adminsRes.data ?? []).map((a) => [
      a.id,
      { name: `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim() || a.email, email: a.email },
    ])
  );

  return (companiesRes.data ?? []).map((c) => ({
    ...c,
    municipality_name: municipalityMap.get(c.municipality_id) ?? "—",
    admin_name: c.admin_id ? adminMap.get(c.admin_id)?.name ?? "—" : "—",
    admin_email: c.admin_id ? adminMap.get(c.admin_id)?.email ?? undefined : undefined,
  }));
}

export async function getMunicipalitiesForSelect() {
  const { data, error } = await supabase
    .from("municipalities")
    .select("id, name")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getCompanyAdminsForSelect() {
  const { data, error } = await supabase
    .from("users")
    .select("id, first_name, last_name, email")
    .eq("role", "company_admin")
    .eq("is_active", true)
    .order("first_name");
  if (error) throw error;
  return data ?? [];
}

export async function createCompany(input: CompanyFormInput) {
  const { data, error } = await supabase
    .from("companies")
    .insert({
      name: input.name,
      registration_number: input.registration_number,
      municipality_id: input.municipality_id,
      contact_person: input.contact_person || null,
      phone: input.phone || null,
      email: input.email || null,
      address: input.address || null,
      admin_id: input.admin_id || null,
      subscription_plan: input.subscription_plan,
      billing_email: input.billing_email || null,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;

  await logAudit("company_created", "companies", data.id, null, data);
  return data;
}

export async function updateCompany(id: string, input: CompanyFormInput) {
  const { data: oldData } = await supabase.from("companies").select("*").eq("id", id).single();

  const { data, error } = await supabase
    .from("companies")
    .update({
      name: input.name,
      registration_number: input.registration_number,
      municipality_id: input.municipality_id,
      contact_person: input.contact_person || null,
      phone: input.phone || null,
      email: input.email || null,
      address: input.address || null,
      admin_id: input.admin_id || null,
      subscription_plan: input.subscription_plan,
      billing_email: input.billing_email || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  await logAudit("company_updated", "companies", id, oldData, data);
  return data;
}

export async function suspendCompany(id: string, reason: string) {
  const { data: oldData } = await supabase.from("companies").select("*").eq("id", id).single();

  const { data, error } = await supabase
    .from("companies")
    .update({
      is_active: false,
      subscription_status: "suspended",
      suspended_at: new Date().toISOString(),
      suspended_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  await logAudit("company_suspended", "companies", id, oldData, data);
  return data;
}

export async function activateCompany(id: string) {
  const { data: oldData } = await supabase.from("companies").select("*").eq("id", id).single();

  const { data, error } = await supabase
    .from("companies")
    .update({
      is_active: true,
      subscription_status: "active",
      suspended_at: null,
      suspended_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  await logAudit("company_activated", "companies", id, oldData, data);
  return data;
}

export async function deleteCompany(id: string) {
  const { data: oldData } = await supabase.from("companies").select("*").eq("id", id).single();

  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) throw error;

  await logAudit("company_deleted", "companies", id, oldData, null);
}