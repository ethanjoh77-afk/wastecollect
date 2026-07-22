import { supabase } from "../lib/supabase";
import type { Complaint, ComplaintStatus, Priority, TicketComment } from "../types";

export interface TicketWithRelations extends Complaint {
  citizen_name?: string;
  citizen_email?: string;
  assigned_to_name?: string;
}

export interface TicketCommentWithUser extends TicketComment {
  user_name?: string;
  user_role?: string;
}

export interface TicketFilters {
  status?: ComplaintStatus | "all";
  priority?: Priority | "all";
  search?: string;
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

export async function getTickets(filters?: TicketFilters): Promise<TicketWithRelations[]> {
  let query = supabase.from("complaints").select("*").order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters?.priority && filters.priority !== "all") {
    query = query.eq("priority", filters.priority);
  }

  const { data: complaints, error } = await query;
  if (error) throw error;

  const citizenIds = Array.from(new Set((complaints ?? []).map((c) => c.citizen_id).filter(Boolean)));
  const assignedIds = Array.from(new Set((complaints ?? []).map((c) => c.assigned_to).filter(Boolean)));
  const allUserIds = Array.from(new Set([...citizenIds, ...assignedIds]));

  const usersById = new Map<string, { name: string; email: string }>();
  if (allUserIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, first_name, last_name, email")
      .in("id", allUserIds);
    (users ?? []).forEach((u) => {
      usersById.set(u.id, { name: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim(), email: u.email });
    });
  }

  let result: TicketWithRelations[] = (complaints ?? []).map((c) => ({
    ...c,
    citizen_name: usersById.get(c.citizen_id)?.name,
    citizen_email: usersById.get(c.citizen_id)?.email,
    assigned_to_name: c.assigned_to ? usersById.get(c.assigned_to)?.name : undefined,
  }));

  if (filters?.search) {
    const term = filters.search.toLowerCase();
    result = result.filter(
      (t) =>
        t.subject?.toLowerCase().includes(term) ||
        t.description?.toLowerCase().includes(term) ||
        t.citizen_name?.toLowerCase().includes(term) ||
        t.citizen_email?.toLowerCase().includes(term)
    );
  }

  return result;
}

export async function getTicketComments(ticketId: string): Promise<TicketCommentWithUser[]> {
  const { data: comments, error } = await supabase
    .from("ticket_comments")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const userIds = Array.from(new Set((comments ?? []).map((c) => c.user_id).filter(Boolean)));
  const usersById = new Map<string, { name: string; role: string }>();
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, first_name, last_name, role")
      .in("id", userIds);
    (users ?? []).forEach((u) => {
      usersById.set(u.id, { name: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim(), role: u.role });
    });
  }

  return (comments ?? []).map((c) => ({
    ...c,
    user_name: usersById.get(c.user_id)?.name,
    user_role: usersById.get(c.user_id)?.role,
  }));
}

export async function addTicketComment(ticketId: string, comment: string) {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) throw new Error("Session imeisha. Tafadhali ingia tena.");

  const { data, error } = await supabase
    .from("ticket_comments")
    .insert({ ticket_id: ticketId, user_id: userId, comment })
    .select()
    .single();
  if (error) throw error;

  await logAudit("ticket_comment_added", "ticket_comments", ticketId, null, { comment });
  return data;
}

export async function updateTicketStatus(id: string, status: ComplaintStatus, resolution?: string) {
  const { data: oldData } = await supabase.from("complaints").select("*").eq("id", id).single();

  const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === "resolved" || status === "closed") {
    updates.resolved_at = new Date().toISOString();
    if (resolution) updates.resolution = resolution;
  }

  const { data, error } = await supabase.from("complaints").update(updates).eq("id", id).select().single();
  if (error) throw error;

  await logAudit("ticket_status_updated", "complaints", id, oldData, data);
  return data;
}

export async function updateTicketPriority(id: string, priority: Priority) {
  const { data: oldData } = await supabase.from("complaints").select("*").eq("id", id).single();

  const { data, error } = await supabase
    .from("complaints")
    .update({ priority, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  await logAudit("ticket_priority_updated", "complaints", id, oldData, data);
  return data;
}

export async function assignTicket(id: string, adminId: string | null) {
  const { data: oldData } = await supabase.from("complaints").select("*").eq("id", id).single();

  const { data, error } = await supabase
    .from("complaints")
    .update({ assigned_to: adminId, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  await logAudit("ticket_assigned", "complaints", id, oldData, data);
  return data;
}

export async function getAssignableAdmins() {
  const { data, error } = await supabase
    .from("users")
    .select("id, first_name, last_name, role")
    .in("role", ["super_admin", "municipality_admin", "company_admin"])
    .eq("is_active", true)
    .order("first_name");
  if (error) throw error;
  return data ?? [];
}
