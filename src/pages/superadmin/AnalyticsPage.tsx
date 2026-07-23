import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Users, Building2, Truck, DollarSign } from "lucide-react";
import { SuperAdminLayout } from "../../components/layout/SuperAdminLayout";
import { StatCard, BarChartCard, PieChartCard, LineChartCard } from "../../components/dashboard";
import {
  getPlatformOverview,
  getUserSignupTrend,
  getRevenueTrend,
  type PlatformOverview,
  type MonthPoint,
} from "../../services/analyticsService";

function toChartData(record: Record<string, number>, labelPrefix: string, t: (k: string) => string) {
  return Object.entries(record).map(([key, value]) => ({
    name: t(`${labelPrefix}_${key}`) || key,
    value,
  }));
}

export default function AnalyticsPage() {
  const { t } = useTranslation();

  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [signupTrend, setSignupTrend] = useState<MonthPoint[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<MonthPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [overviewData, signups, revenue] = await Promise.all([
          getPlatformOverview(),
          getUserSignupTrend(6),
          getRevenueTrend(6),
        ]);
        setOverview(overviewData);
        setSignupTrend(signups);
        setRevenueTrend(revenue);
      } catch (err) {
        console.error(err);
        toast.error(t("superadmin_analytics_load_failed"));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !overview) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
        </div>
      </SuperAdminLayout>
    );
  }

  const usersByRoleData = toChartData(overview.usersByRole, "superadmin_analytics_role", t);
  const complaintsData = toChartData(overview.complaintsByStatus, "superadmin_support_status", t);
  const vehiclesData = toChartData(overview.vehiclesByStatus, "superadmin_analytics_vehicle_status", t);
  const routesData = toChartData(overview.routesByStatus, "superadmin_analytics_route_status", t);

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
            {t("superadmin_nav_analytics")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">{t("superadmin_analytics_subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t("superadmin_analytics_stat_users")}
            value={overview.totalUsers}
            icon={Users}
            iconColor="bg-primary-500"
          />
          <StatCard
            title={t("superadmin_analytics_stat_companies")}
            value={`${overview.activeCompanies}/${overview.totalCompanies}`}
            icon={Building2}
            iconColor="bg-blue-500"
          />
          <StatCard
            title={t("superadmin_analytics_stat_municipalities")}
            value={overview.totalMunicipalities}
            icon={Building2}
            iconColor="bg-emerald-500"
          />
          <StatCard
            title={t("superadmin_analytics_stat_revenue")}
            value={`TZS ${overview.paymentsTotalCompleted.toLocaleString()}`}
            icon={DollarSign}
            iconColor="bg-amber-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LineChartCard
            title={t("superadmin_analytics_chart_signups")}
            data={signupTrend}
            lines={[{ dataKey: "value", stroke: "#10b981", name: t("superadmin_analytics_stat_users") }]}
          />
          <LineChartCard
            title={t("superadmin_analytics_chart_revenue")}
            data={revenueTrend}
            lines={[{ dataKey: "value", stroke: "#0ea5e9", name: "TZS" }]}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PieChartCard title={t("superadmin_analytics_chart_users_by_role")} data={usersByRoleData} />
          <PieChartCard title={t("superadmin_analytics_chart_complaints_status")} data={complaintsData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BarChartCard title={t("superadmin_analytics_chart_vehicles_status")} data={vehiclesData} />
          <BarChartCard title={t("superadmin_analytics_chart_routes_status")} data={routesData} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title={t("superadmin_analytics_stat_pending_payments")}
            value={`TZS ${overview.paymentsTotalPending.toLocaleString()}`}
            icon={DollarSign}
            iconColor="bg-orange-500"
          />
          <StatCard
            title={t("superadmin_analytics_stat_open_complaints")}
            value={overview.complaintsByStatus.open ?? 0}
            icon={Users}
            iconColor="bg-red-500"
          />
          <StatCard
            title={t("superadmin_analytics_stat_active_vehicles")}
            value={(overview.vehiclesByStatus.on_route ?? 0) + (overview.vehiclesByStatus.available ?? 0)}
            icon={Truck}
            iconColor="bg-teal-500"
          />
        </div>
      </div>
    </SuperAdminLayout>
  );
}
