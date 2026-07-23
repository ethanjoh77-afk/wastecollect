import { supabase } from "../lib/supabase";

export interface AuditLogEntry {
  id: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  action: string;
  table_name?: string;
  record_id?: string;
  old_values?: object | null;
  new_values?: object | null;
  created_at: string;
}

export interface AuditLogFilters {
  action?: string;
  tableName?: string;
  search?: string;
}

export async function getAuditLogs(filters: AuditLogFilters = {}, limit = 100): Promise<AuditLogEntry[]> {
  let query = supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.action) query = query.eq("action", filters.action);
  if (filters.tableName) query = query.eq("table_name", filters.tableName);

  const { data: logs, error } = await query;
  if (error) throw error;

  const userIds = Array.from(new Set((logs ?? []).map((l) => l.user_id).filter(Boolean)));

  const { data: users } = userIds.length
    ? await supabase.from("users").select("id, first_name, last_name, email").in("id", userIds)
    : { data: [] };

  const userMap = new Map(
    (users ?? []).map((u) => [u.id, { name: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email, email: u.email }])
  );

  let results: AuditLogEntry[] = (logs ?? []).map((l) => ({
    ...l,
    user_name: l.user_id ? userMap.get(l.user_id)?.name ?? "—" : t_system(),
    user_email: l.user_id ? userMap.get(l.user_id)?.email : undefined,
  }));

  if (filters.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(
      (r) =>
        r.action.toLowerCase().includes(q) ||
        (r.table_name ?? "").toLowerCase().includes(q) ||
        (r.user_name ?? "").toLowerCase().includes(q)
    );
  }

  return results;
}

function t_system() {
  return "System";
}

export async function getDistinctActions(): Promise<string[]> {
  const { data } = await supabase.from("audit_logs").select("action").limit(500);
  return Array.from(new Set((data ?? []).map((d) => d.action))).sort();
}