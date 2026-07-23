import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { CreditCard, Building2, Clock, DollarSign } from "lucide-react";
import { SuperAdminLayout } from "../../components/layout/SuperAdminLayout";
import { DataTable, StatCard } from "../../components/dashboard";
import { Select, Modal, Textarea, Button, Badge } from "../../components/common";
import {
  getCompanySubscriptions,
  getSubscriptionStats,
  updateSubscriptionPlan,
  updateSubscriptionStatus,
  type CompanySubscription,
  type SubscriptionPlan,
  type SubscriptionStatus,
  type SubscriptionStats,
} from "../../services/subscriptionsService";

const planVariant: Record<SubscriptionPlan, "default" | "info" | "warning" | "success"> = {
  trial: "default",
  standard: "info",
  professional: "warning",
  enterprise: "success",
};

const statusVariant: Record<SubscriptionStatus, "success" | "warning" | "error" | "default"> = {
  active: "success",
  past_due: "warning",
  suspended: "error",
  cancelled: "default",
};

export default function SubscriptionsPage() {
  const { t } = useTranslation();

  const [companies, setCompanies] = useState<CompanySubscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [planFilter, setPlanFilter] = useState<SubscriptionPlan | "all">("all");
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | "all">("all");

  const [activeCompany, setActiveCompany] = useState<CompanySubscription | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>("trial");
  const [selectedStatus, setSelectedStatus] = useState<SubscriptionStatus>("active");
  const [suspendReason, setSuspendReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [companiesData, statsData] = await Promise.all([
        getCompanySubscriptions(),
        getSubscriptionStats(),
      ]);
      setCompanies(companiesData);
      setStats(statsData);
    } catch (err) {
      console.error(err);
      toast.error(t("superadmin_subscriptions_load_failed"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = companies.filter((c) => {
    if (planFilter !== "all" && (c.subscription_plan ?? "trial") !== planFilter) return false;
    if (statusFilter !== "all" && (c.subscription_status ?? "active") !== statusFilter) return false;
    return true;
  });

  function openManage(company: CompanySubscription) {
    setActiveCompany(company);
    setSelectedPlan((company.subscription_plan ?? "trial") as SubscriptionPlan);
    setSelectedStatus((company.subscription_status ?? "active") as SubscriptionStatus);
    setSuspendReason(company.suspended_reason || "");
  }

  async function handleSave() {
    if (!activeCompany) return;
    setSaving(true);
    try {
      if (selectedPlan !== (activeCompany.subscription_plan ?? "trial")) {
        await updateSubscriptionPlan(activeCompany.id, selectedPlan);
      }
      if (selectedStatus !== (activeCompany.subscription_status ?? "active")) {
        await updateSubscriptionStatus(activeCompany.id, selectedStatus, suspendReason);
      }
      toast.success(t("superadmin_subscriptions_updated"));
      setActiveCompany(null);
      loadData();
    } catch (err: any) {
      toast.error(err?.message || t("superadmin_subscriptions_action_failed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
            {t("superadmin_nav_subscriptions")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">{t("superadmin_subscriptions_subtitle")}</p>
        </div>

        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={t("superadmin_subscriptions_stat_total")}
              value={stats.totalCompanies}
              icon={Building2}
              iconColor="bg-primary-500"
            />
            <StatCard
              title={t("superadmin_subscriptions_stat_active")}
              value={stats.byStatus.active}
              icon={CreditCard}
              iconColor="bg-green-500"
            />
            <StatCard
              title={t("superadmin_subscriptions_stat_trial_ending")}
              value={stats.trialsEndingSoon}
              icon={Clock}
              iconColor="bg-amber-500"
            />
            <StatCard
              title={t("superadmin_subscriptions_stat_revenue")}
              value={`TZS ${stats.totalSubscriptionRevenue.toLocaleString()}`}
              icon={DollarSign}
              iconColor="bg-blue-500"
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value as SubscriptionPlan | "all")}
            options={[
              { value: "all", label: t("superadmin_subscriptions_filter_all_plans") },
              { value: "trial", label: t("superadmin_subscriptions_plan_trial") },
              { value: "standard", label: t("superadmin_subscriptions_plan_standard") },
              { value: "professional", label: t("superadmin_subscriptions_plan_professional") },
              { value: "enterprise", label: t("superadmin_subscriptions_plan_enterprise") },
            ]}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SubscriptionStatus | "all")}
            options={[
              { value: "all", label: t("superadmin_subscriptions_filter_all_status") },
              { value: "active", label: t("superadmin_subscriptions_status_active") },
              { value: "past_due", label: t("superadmin_subscriptions_status_past_due") },
              { value: "suspended", label: t("superadmin_subscriptions_status_suspended") },
              { value: "cancelled", label: t("superadmin_subscriptions_status_cancelled") },
            ]}
          />
        </div>

        <DataTable<CompanySubscription>
          isLoading={loading}
          data={filtered}
          keyExtractor={(c) => c.id}
          onRowClick={openManage}
          columns={[
            {
              key: "name",
              header: t("superadmin_subscriptions_col_company"),
              render: (c) => (
                <div>
                  <p className="font-medium text-secondary-900 dark:text-white">{c.name}</p>
                  <p className="text-xs text-slate-400">{c.municipality_name}</p>
                </div>
              ),
            },
            {
              key: "subscription_plan",
              header: t("superadmin_subscriptions_col_plan"),
              render: (c) => (
                <Badge variant={planVariant[(c.subscription_plan ?? "trial") as SubscriptionPlan]}>
                  {t(`superadmin_subscriptions_plan_${c.subscription_plan ?? "trial"}`)}
                </Badge>
              ),
            },
            {
              key: "subscription_status",
              header: t("superadmin_subscriptions_col_status"),
              render: (c) => (
                <Badge variant={statusVariant[(c.subscription_status ?? "active") as SubscriptionStatus]} dot>
                  {t(`superadmin_subscriptions_status_${c.subscription_status ?? "active"}`)}
                </Badge>
              ),
            },
            {
              key: "trial_ends_at",
              header: t("superadmin_subscriptions_col_trial_ends"),
              render: (c) => (c.trial_ends_at ? new Date(c.trial_ends_at).toLocaleDateString() : "—"),
            },
            {
              key: "billing_email",
              header: t("superadmin_subscriptions_col_billing_email"),
              render: (c) => c.billing_email || c.email || "—",
            },
          ]}
        />
      </div>

      <Modal
        isOpen={!!activeCompany}
        onClose={() => setActiveCompany(null)}
        title={activeCompany?.name}
        size="md"
      >
        {activeCompany && (
          <div className="space-y-4">
            <Select
              label={t("superadmin_subscriptions_field_plan")}
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value as SubscriptionPlan)}
              options={[
                { value: "trial", label: t("superadmin_subscriptions_plan_trial") },
                { value: "standard", label: t("superadmin_subscriptions_plan_standard") },
                { value: "professional", label: t("superadmin_subscriptions_plan_professional") },
                { value: "enterprise", label: t("superadmin_subscriptions_plan_enterprise") },
              ]}
            />
            <Select
              label={t("superadmin_subscriptions_field_status")}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as SubscriptionStatus)}
              options={[
                { value: "active", label: t("superadmin_subscriptions_status_active") },
                { value: "past_due", label: t("superadmin_subscriptions_status_past_due") },
                { value: "suspended", label: t("superadmin_subscriptions_status_suspended") },
                { value: "cancelled", label: t("superadmin_subscriptions_status_cancelled") },
              ]}
            />
            {selectedStatus === "suspended" && (
              <Textarea
                label={t("superadmin_subscriptions_field_reason")}
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                rows={3}
              />
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setActiveCompany(null)}>
                {t("superadmin_companies_cancel")}
              </Button>
              <Button onClick={handleSave} isLoading={saving}>
                {t("superadmin_subscriptions_save")}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </SuperAdminLayout>
  );
}
