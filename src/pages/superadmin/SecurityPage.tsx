import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Shield, KeyRound, Users, Ban, CheckCircle2 } from "lucide-react";
import { SuperAdminLayout } from "../../components/layout/SuperAdminLayout";
import { DataTable, StatCard } from "../../components/dashboard";
import { Badge, Select } from "../../components/common";
import {
  getSecurityEvents,
  getRecentOtpActivity,
  getAccountsOverview,
  setAccountActive,
  type SecurityEvent,
  type OtpActivity,
  type AccountOverview,
} from "../../services/securityService";

type Tab = "events" | "otp" | "accounts";

export default function SecurityPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("events");

  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [otpActivity, setOtpActivity] = useState<OtpActivity[]>([]);
  const [accounts, setAccounts] = useState<AccountOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    try {
      const [e, o, a] = await Promise.all([
        getSecurityEvents(),
        getRecentOtpActivity(),
        getAccountsOverview(),
      ]);
      setEvents(e);
      setOtpActivity(o);
      setAccounts(a);
    } catch (err) {
      console.error(err);
      toast.error(t("superadmin_security_load_failed"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleToggleAccount(account: AccountOverview) {
    setActionLoadingId(account.id);
    try {
      await setAccountActive(account.id, !account.is_active);
      setAccounts((prev) =>
        prev.map((a) => (a.id === account.id ? { ...a, is_active: !a.is_active } : a))
      );
      toast.success(
        account.is_active
          ? t("superadmin_security_account_deactivated")
          : t("superadmin_security_account_activated")
      );
    } catch (err: any) {
      toast.error(err?.message || t("superadmin_security_action_failed"));
    } finally {
      setActionLoadingId(null);
    }
  }

  const inactiveAccounts = accounts.filter((a) => !a.is_active).length;
  const unverifiedAccounts = accounts.filter((a) => !a.is_verified).length;
  const filteredAccounts = accounts.filter((a) => roleFilter === "all" || a.role === roleFilter);

  const tabs: { id: Tab; label: string }[] = [
    { id: "events", label: t("superadmin_security_tab_events") },
    { id: "otp", label: t("superadmin_security_tab_otp") },
    { id: "accounts", label: t("superadmin_security_tab_accounts") },
  ];

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
            {t("superadmin_nav_security")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">{t("superadmin_security_subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title={t("superadmin_security_stat_total_accounts")}
            value={accounts.length}
            icon={Users}
            iconColor="bg-primary-500"
          />
          <StatCard
            title={t("superadmin_security_stat_inactive")}
            value={inactiveAccounts}
            icon={Ban}
            iconColor="bg-red-500"
          />
          <StatCard
            title={t("superadmin_security_stat_unverified")}
            value={unverifiedAccounts}
            icon={Shield}
            iconColor="bg-amber-500"
          />
        </div>

        <div className="flex gap-2 border-b border-secondary-200 dark:border-slate-700">
          {tabs.map((tItem) => (
            <button
              key={tItem.id}
              onClick={() => setTab(tItem.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === tItem.id
                  ? "border-primary-500 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-slate-500 hover:text-secondary-700 dark:hover:text-secondary-300"
              }`}
            >
              {tItem.label}
            </button>
          ))}
        </div>

        {tab === "events" && (
          <DataTable<SecurityEvent>
            isLoading={loading}
            data={events}
            keyExtractor={(e) => e.id}
            emptyState={
              <div className="text-center py-14">
                <Shield className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">{t("superadmin_security_no_events")}</p>
              </div>
            }
            columns={[
              {
                key: "action",
                header: t("superadmin_security_col_action"),
                render: (e) => <Badge variant="info">{e.action}</Badge>,
              },
              {
                key: "user_name",
                header: t("superadmin_security_col_by"),
                render: (e) => e.user_name || e.user_email || t("superadmin_audit_system"),
              },
              {
                key: "table_name",
                header: t("superadmin_audit_col_table"),
                render: (e) => e.table_name || "—",
              },
              {
                key: "created_at",
                header: t("superadmin_audit_col_date"),
                render: (e) => new Date(e.created_at).toLocaleString(),
              },
            ]}
          />
        )}

        {tab === "otp" && (
          <DataTable<OtpActivity>
            isLoading={loading}
            data={otpActivity}
            keyExtractor={(o) => o.id}
            emptyState={
              <div className="text-center py-14">
                <KeyRound className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">{t("superadmin_security_no_otp")}</p>
              </div>
            }
            columns={[
              {
                key: "type",
                header: t("superadmin_security_col_otp_type"),
                render: (o) => <Badge variant="default">{t(`superadmin_security_otp_type_${o.type}`)}</Badge>,
              },
              {
                key: "user_name",
                header: t("superadmin_security_col_for"),
                render: (o) => o.user_name || o.user_email || "—",
              },
              {
                key: "is_used",
                header: t("superadmin_security_col_used"),
                render: (o) => (
                  <Badge variant={o.is_used ? "success" : "warning"} dot>
                    {o.is_used ? t("superadmin_security_used") : t("superadmin_security_not_used")}
                  </Badge>
                ),
              },
              {
                key: "expires_at",
                header: t("superadmin_security_col_expires"),
                render: (o) => new Date(o.expires_at).toLocaleString(),
              },
              {
                key: "created_at",
                header: t("superadmin_audit_col_date"),
                render: (o) => new Date(o.created_at).toLocaleString(),
              },
            ]}
          />
        )}

        {tab === "accounts" && (
          <div className="space-y-3">
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              options={[
                { value: "all", label: t("superadmin_security_filter_all_roles") },
                { value: "super_admin", label: "Super Admin" },
                { value: "municipality_admin", label: t("superadmin_analytics_role_municipality_admin") },
                { value: "company_admin", label: t("superadmin_analytics_role_company_admin") },
                { value: "driver", label: t("superadmin_analytics_role_driver") },
                { value: "citizen", label: t("superadmin_analytics_role_citizen") },
              ]}
            />
            <DataTable<AccountOverview>
              isLoading={loading}
              data={filteredAccounts}
              keyExtractor={(a) => a.id}
              columns={[
                {
                  key: "email",
                  header: t("superadmin_security_col_account"),
                  render: (a) => (
                    <div>
                      <p className="font-medium text-secondary-900 dark:text-white">
                        {`${a.first_name ?? ""} ${a.last_name ?? ""}`.trim() || a.email}
                      </p>
                      <p className="text-xs text-slate-400">{a.email}</p>
                    </div>
                  ),
                },
                {
                  key: "role",
                  header: t("superadmin_security_col_role"),
                  render: (a) => a.role,
                },
                {
                  key: "is_verified",
                  header: t("superadmin_security_col_verified"),
                  render: (a) => (
                    <Badge variant={a.is_verified ? "success" : "warning"} dot>
                      {a.is_verified
                        ? t("superadmin_security_verified")
                        : t("superadmin_security_unverified")}
                    </Badge>
                  ),
                },
                {
                  key: "last_login",
                  header: t("superadmin_security_col_last_login"),
                  render: (a) => (a.last_login ? new Date(a.last_login).toLocaleString() : "—"),
                },
                {
                  key: "actions",
                  header: "",
                  render: (a) => (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleAccount(a);
                      }}
                      disabled={actionLoadingId === a.id}
                      className={
                        a.is_active
                          ? "p-2 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                          : "p-2 rounded-lg text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
                      }
                      title={
                        a.is_active
                          ? t("superadmin_security_deactivate")
                          : t("superadmin_security_activate")
                      }
                    >
                      {a.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    </button>
                  ),
                },
              ]}
            />
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}
