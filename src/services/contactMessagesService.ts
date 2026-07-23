import { supabase } from "../lib/supabase";

export type ContactStatus = "NEW" | "UNDER_REVIEW" | "FORWARDED" | "REPLIED" | "RESOLVED" | "ARCHIVED";
export type ContactPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface ContactMessageEntry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  ticket_number?: string;
  status: ContactStatus;
  priority: ContactPriority;
  admin_id?: string;
  admin_name?: string;
  forwarded_to_super_admin: boolean;
  forwarded_at?: string;
  resolved_at?: string;
  reply?: string;
  reply_by?: string;
  reply_by_name?: string;
  reply_date?: string;
  internal_note?: string;
  deleted_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface ContactMessageFilters {
  status?: ContactStatus | "all";
  priority?: ContactPriority | "all";
  search?: string;
  sort?: "newest" | "unread" | "resolved";
  dateFrom?: string;
  dateTo?: string;
}

async function logAction(
  action: string,
  recordId: string,
  oldValues?: object | null,
  newValues?: object | null
) {
  try {
    const { data: authData } = await supabase.auth.getUser();
    await supabase.from("audit_logs").insert({
      user_id: authData.user?.id,
      action,
      table_name: "contact_messages",
      record_id: recordId,
      old_values: oldValues ?? null,
      new_values: newValues ?? null,
    });
  } catch (err) {
    console.error("Imeshindikana kuandika audit log:", err);
  }
}

async function attachAdminNames(rows: any[]): Promise<ContactMessageEntry[]> {
  const adminIds = Array.from(
    new Set(rows.flatMap((r) => [r.admin_id, r.reply_by]).filter(Boolean))
  );

  const adminMap = new Map<string, string>();
  if (adminIds.length > 0) {
    const { data: admins } = await supabase
      .from("users")
      .select("id, first_name, last_name, email")
      .in("id", adminIds);
    (admins ?? []).forEach((a) => {
      adminMap.set(a.id, `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim() || a.email);
    });
  }

  return rows.map((r) => ({
    ...r,
    admin_name: r.admin_id ? adminMap.get(r.admin_id) : undefined,
    reply_by_name: r.reply_by ? adminMap.get(r.reply_by) : undefined,
  }));
}

/** Fomu ya umma inaita hii — hakuna auth inayohitajika (anon insert policy tayari ipo). */
export async function submitContactMessage(input: {
  name: string;
  email: string;
  subject?: string;
  message: string;
  phone?: string;
}) {
  const { error } = await supabase.from("contact_messages").insert({
    name: input.name,
    email: input.email,
    subject: input.subject || null,
    message: input.message,
    phone: input.phone || null,
  });
  if (error) throw error;
}

/** Admin queue — ujumbe wote usiofutwa (haujazingatia forwarded_to_super_admin). */
export async function getAdminMessages(filters: ContactMessageFilters = {}): Promise<ContactMessageEntry[]> {
  let query = supabase.from("contact_messages").select("*").is("deleted_at", null);

  if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters.priority && filters.priority !== "all") query = query.eq("priority", filters.priority);
  if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
  if (filters.dateTo) query = query.lte("created_at", filters.dateTo);

  if (filters.sort === "unread") query = query.eq("status", "NEW");
  if (filters.sort === "resolved") query = query.eq("status", "RESOLVED");

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) throw error;

  let result = await attachAdminNames(data ?? []);

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.subject ?? "").toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q) ||
        (m.ticket_number ?? "").toLowerCase().includes(q)
    );
  }

  return result;
}

/** Super Admin — ujumbe uliofikishwa (forwarded) pekee. */
export async function getForwardedMessages(filters: ContactMessageFilters = {}): Promise<ContactMessageEntry[]> {
  let query = supabase
    .from("contact_messages")
    .select("*")
    .is("deleted_at", null)
    .eq("forwarded_to_super_admin", true);

  if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters.priority && filters.priority !== "all") query = query.eq("priority", filters.priority);

  query = query.order("forwarded_at", { ascending: false });

  const { data, error } = await query;
  if (error) throw error;

  let result = await attachAdminNames(data ?? []);

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.subject ?? "").toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q)
    );
  }

  return result;
}

export async function markUnderReview(id: string) {
  const { data: authData } = await supabase.auth.getUser();
  const { data: oldData } = await supabase.from("contact_messages").select("*").eq("id", id).single();

  const { error } = await supabase
    .from("contact_messages")
    .update({ status: "UNDER_REVIEW", admin_id: authData.user?.id, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;

  await logAction("viewed", id, oldData, { status: "UNDER_REVIEW" });
}

export async function replyToMessage(id: string, replyText: string) {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error("Session imeisha. Tafadhali ingia tena.");

  const { data: oldData } = await supabase.from("contact_messages").select("*").eq("id", id).single();

  const updates = {
    reply: replyText,
    reply_by: authData.user.id,
    reply_date: new Date().toISOString(),
    status: "REPLIED" as ContactStatus,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("contact_messages").update(updates).eq("id", id);
  if (error) throw error;

  await logAction("replied", id, oldData, updates);
}

export async function forwardToSuperAdmin(id: string) {
  const { data: oldData } = await supabase.from("contact_messages").select("*").eq("id", id).single();

  const updates = {
    forwarded_to_super_admin: true,
    forwarded_at: new Date().toISOString(),
    status: "FORWARDED" as ContactStatus,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("contact_messages").update(updates).eq("id", id);
  if (error) throw error;

  await logAction("forwarded", id, oldData, updates);
}

export async function resolveMessage(id: string) {
  const { data: oldData } = await supabase.from("contact_messages").select("*").eq("id", id).single();

  const updates = {
    status: "RESOLVED" as ContactStatus,
    resolved_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("contact_messages").update(updates).eq("id", id);
  if (error) throw error;

  await logAction("resolved", id, oldData, updates);
}

export async function archiveMessage(id: string) {
  const { data: oldData } = await supabase.from("contact_messages").select("*").eq("id", id).single();

  const { error } = await supabase
    .from("contact_messages")
    .update({ status: "ARCHIVED", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;

  await logAction("archived", id, oldData, { status: "ARCHIVED" });
}

/** Soft delete pekee — hakuna hard DELETE (RLS haina policy ya DELETE kwa makusudi). */
export async function softDeleteMessage(id: string) {
  const { data: oldData } = await supabase.from("contact_messages").select("*").eq("id", id).single();

  const { error } = await supabase
    .from("contact_messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;

  await logAction("deleted", id, oldData, { deleted_at: new Date().toISOString() });
}

export async function addInternalNote(id: string, note: string) {
  const { data: oldData } = await supabase.from("contact_messages").select("*").eq("id", id).single();

  const { error } = await supabase
    .from("contact_messages")
    .update({ internal_note: note, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;

  await logAction("internal_note_added", id, oldData, { internal_note: note });
}

export async function updateMessagePriority(id: string, priority: ContactPriority) {
  const { data: oldData } = await supabase.from("contact_messages").select("*").eq("id", id).single();

  const { error } = await supabase
    .from("contact_messages")
    .update({ priority, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;

  await logAction("priority_updated", id, oldData, { priority });
}

export async function assignTask(id: string, adminId: string) {
  const { data: oldData } = await supabase.from("contact_messages").select("*").eq("id", id).single();

  const { error } = await supabase
    .from("contact_messages")
    .update({ admin_id: adminId, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;

  await logAction("assigned", id, oldData, { admin_id: adminId });
}

export async function closeTicket(id: string) {
  const { data: oldData } = await supabase.from("contact_messages").select("*").eq("id", id).single();

  const { error } = await supabase
    .from("contact_messages")
    .update({ status: "ARCHIVED", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;

  await logAction("closed", id, oldData, { status: "ARCHIVED" });
}

export async function getAssignableAdmins() {
  const { data, error } = await supabase
    .from("users")
    .select("id, first_name, last_name, email, role")
    .in("role", ["super_admin", "municipality_admin", "company_admin"])
    .eq("is_active", true)
    .order("first_name");
  if (error) throw error;
  return data ?? [];
}

export function exportTicketAsText(entry: ContactMessageEntry) {
  const lines = [
    `Ticket: ${entry.ticket_number ?? entry.id}`,
    `Jina: ${entry.name}`,
    `Barua Pepe: ${entry.email}`,
    entry.phone ? `Simu: ${entry.phone}` : null,
    entry.subject ? `Kichwa: ${entry.subject}` : null,
    `Hali: ${entry.status}`,
    `Kipaumbele: ${entry.priority}`,
    `Tarehe: ${new Date(entry.created_at).toLocaleString()}`,
    "",
    "Ujumbe:",
    entry.message,
    "",
    entry.reply ? `Jibu (${entry.reply_by_name ?? "Admin"}, ${entry.reply_date ? new Date(entry.reply_date).toLocaleString() : ""}):` : null,
    entry.reply ?? null,
    "",
    entry.internal_note ? "Maelezo ya Ndani:" : null,
    entry.internal_note ?? null,
  ].filter((l) => l !== null);

  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ticket-${entry.ticket_number ?? entry.id}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}