import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { ScrollText, Search } from "lucide-react";
import { SuperAdminLayout } from "../../components/layout/SuperAdminLayout";
import { DataTable } from "../../components/dashboard";
import { Input, Select, Badge } from "../../components/common";
import {
  getAuditLogs,
  getDistinctActions,
  type AuditLogEntry,
} from "../../services/auditLogsService";

const actionColor: Record<string, "success" | "warning" | "error" | "info" | "default"> = {
  company_created: "success",
  company_updated: "info",
  company_suspended: "warning",
  company_activated: "success",
  company_deleted: "error",
  admin_created: "success",
  admin_activated: "success",
  admin_deactivated: "warning",
  admin_deleted: "error",
  subscription_plan_changed: "info",
  subscription_status_changed: "warning",
};

export default function AuditLogsPage() {
  const { t } = useTranslation();

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [search, setSearch] = useState("");

  async function loadLogs() {
    setLoading(true);
    try {
      const data = await getAuditLogs({ action: actionFilter || undefined, search: search || undefined });
      setLogs(data);
    } catch (err) {
      console.error(err);
      toast.error(t("superadmin_audit_load_failed"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getDistinctActions().then(setActions).catch(console.error);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(loadLogs, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFilter, search]);

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
            {t("superadmin_nav_audit")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">{t("superadmin_audit_subtitle")}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder={t("superadmin_audit_search_placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <Select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            options={[
              { value: "", label: t("superadmin_audit_filter_all_actions") },
              ...actions.map((a) => ({ value: a, label: a.replaceAll("_", " ") })),
            ]}
          />
        </div>

        <DataTable<AuditLogEntry>
          isLoading={loading}
          data={logs}
          keyExtractor={(l) => l.id}
          emptyState={
            <div className="text-center py-14">
              <ScrollText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">{t("superadmin_audit_none_found")}</p>
            </div>
          }
          columns={[
            {
              key: "created_at",
              header: t("superadmin_audit_col_time"),
              render: (l) => (
                <span className="text-sm text-slate-500 whitespace-nowrap">
                  {new Date(l.created_at).toLocaleString()}
                </span>
              ),
            },
            {
              key: "user_name",
              header: t("superadmin_audit_col_user"),
              render: (l) => (
                <div>
                  <p className="font-medium text-secondary-900 dark:text-white">{l.user_name}</p>
                  {l.user_email && <p className="text-xs text-slate-400">{l.user_email}</p>}
                </div>
              ),
            },
            {
              key: "action",
              header: t("superadmin_audit_col_action"),
              render: (l) => (
                <Badge variant={actionColor[l.action] ?? "default"}>
                  {l.action.replaceAll("_", " ")}
                </Badge>
              ),
            },
            {
              key: "table_name",
              header: t("superadmin_audit_col_table"),
              render: (l) => l.table_name ?? "—",
            },
            {
              key: "record_id",
              header: t("superadmin_audit_col_record"),
              render: (l) => (
                <span className="text-xs text-slate-400 font-mono">
                  {l.record_id ? `${l.record_id.slice(0, 8)}…` : "—"}
                </span>
              ),
            },
          ]}
        />
      </div>
    </SuperAdminLayout>
  );
}