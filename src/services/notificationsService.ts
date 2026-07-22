import { supabase } from "../lib/supabase";
import type { Notification, NotificationType, UserRole } from "../types";

export interface NotificationWithRecipient extends Notification {
  recipient_name?: string;
  recipient_email?: string;
}

export interface RecipientOption {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface SendNotificationInput {
  title: string;
  message: string;
  sent_via: NotificationType;
  target: "user" | "role" | "all";
  user_id?: string;
  role?: UserRole;
}

async function logAudit(action: string, tableName: string, recordId: string, newValues?: object | null) {
  try {
    const { data: authData } = await supabase.auth.getUser();
    await supabase.from("audit_logs").insert({
      user_id: authData.user?.id,
      action,
      table_name: tableName,
      record_id: recordId,
      old_values: null,
      new_values: newValues ?? null,
    });
  } catch (err) {
    console.error("Imeshindikana kuandika audit log:", err);
  }
}

export async function getSentNotifications(limit = 100): Promise<NotificationWithRecipient[]> {
  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  const userIds = Array.from(new Set((notifications ?? []).map((n) => n.user_id).filter(Boolean)));
  const usersById = new Map<string, { name: string; email: string }>();
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, first_name, last_name, email")
      .in("id", userIds);
    (users ?? []).forEach((u) => {
      usersById.set(u.id, { name: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim(), email: u.email });
    });
  }

  return (notifications ?? []).map((n) => ({
    ...n,
    recipient_name: usersById.get(n.user_id)?.name,
    recipient_email: usersById.get(n.user_id)?.email,
  }));
}

export async function getRecipientOptions(): Promise<RecipientOption[]> {
  const { data, error } = await supabase
    .from("users")
    .select("id, first_name, last_name, email, role")
    .eq("is_active", true)
    .order("first_name");
  if (error) throw error;
  return (data ?? []).map((u) => ({
    id: u.id,
    name: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email,
    email: u.email,
    role: u.role,
  }));
}

export async function sendNotification(input: SendNotificationInput) {
  let recipientIds: string[] = [];

  if (input.target === "user") {
    if (!input.user_id) throw new Error("Chagua mtumiaji atakayepokea arifa");
    recipientIds = [input.user_id];
  } else if (input.target === "role") {
    if (!input.role) throw new Error("Chagua kundi la watumiaji");
    const { data, error } = await supabase.from("users").select("id").eq("role", input.role).eq("is_active", true);
    if (error) throw error;
    recipientIds = (data ?? []).map((u) => u.id);
  } else {
    const { data, error } = await supabase.from("users").select("id").eq("is_active", true);
    if (error) throw error;
    recipientIds = (data ?? []).map((u) => u.id);
  }

  if (recipientIds.length === 0) {
    throw new Error("Hakuna mtumiaji yeyote anayelingana na uchaguzi wako");
  }

  const rows = recipientIds.map((userId) => ({
    user_id: userId,
    type: "admin_broadcast",
    title: input.title,
    message: input.message,
    sent_via: input.sent_via,
    is_read: false,
  }));

  const { data, error } = await supabase.from("notifications").insert(rows).select();
  if (error) throw error;

  await logAudit("notification_sent", "notifications", data?.[0]?.id ?? "bulk", {
    title: input.title,
    target: input.target,
    recipients_count: recipientIds.length,
  });

  return { count: recipientIds.length };
}

export async function deleteNotification(id: string) {
  const { error } = await supabase.from("notifications").delete().eq("id", id);
  if (error) throw error;
  await logAudit("notification_deleted", "notifications", id);
}
