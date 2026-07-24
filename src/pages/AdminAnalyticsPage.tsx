import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { BarChart3, Truck, Users2, MessageSquare, DollarSign, CheckCircle2 } from "lucide-react";
import { DashboardLayout } from "../components/layout";
import { StatCard, BarChartCard } from "../components/dashboard";
import { getMyScopedAnalytics, type ScopedAnalytics } from "../services/adminAnalyticsService";

function toChartData(record: Record<string, number>) {
  return Object.entries(record).map(([name, value]) => ({ name, value }));
}

export default function AdminAnalyticsPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<ScopedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const result = await getMyScopedAnalytics();
        setData(result);
      } catch (err) {
        console.error(err);
        toast.error(t("admin_analytics_load_failed", "Imeshindikana kupakia takwimu"));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (data.scopeType === "unscoped") {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 text-center gap-2">
          <BarChart3 className="w-10 h-10 text-slate-300" />
          <p className="text-slate-500">
            {t("admin_analytics_no_scope", "Bado hujapangiwa kampuni au manispaa — wasiliana na Super Admin.")}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            {t("admin_analytics_title", "Uchambuzi")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {data.scopeType === "company"
              ? t("admin_analytics_subtitle_company", "Takwimu za kampuni: {{name}}", { name: data.scopeName })
              : t("admin_analytics_subtitle_municipality", "Takwimu za manispaa: {{name}}", { name: data.scopeName })}
          </p>
        </div>

        {data.scopeType === "company" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title={t("admin_analytics_stat_drivers", "Madereva")} value={data.driverCount} icon={Users2} iconColor="bg-primary-500" />
              <StatCard title={t("admin_analytics_stat_vehicles", "Magari")} value={data.vehicleCount} icon={Truck} iconColor="bg-secondary-500" />
              <StatCard title={t("admin_analytics_stat_completed", "Njia Zilizokamilika")} value={data.completedCollections} icon={CheckCircle2} iconColor="bg-success-500" />
              <StatCard
                title={t("admin_analytics_stat_active_vehicles", "Magari Yanayofanya Kazi")}
                value={(data.vehiclesByStatus.available ?? 0) + (data.vehiclesByStatus.on_route ?? 0)}
                icon={Truck}
                iconColor="bg-teal-500"
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BarChartCard title={t("admin_analytics_chart_vehicles", "Magari kwa Hali")} data={toChartData(data.vehiclesByStatus)} />
              <BarChartCard title={t("admin_analytics_chart_routes", "Njia kwa Hali")} data={toChartData(data.routesByStatus)} />
            </div>
          </>
        )}

        {data.scopeType === "municipality" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title={t("admin_analytics_stat_complaints", "Malalamiko Yote")} value={data.complaintCount} icon={MessageSquare} iconColor="bg-warning-500" />
              <StatCard title={t("admin_analytics_stat_open_complaints", "Malalamiko Wazi")} value={data.complaintsByStatus.open ?? 0} icon={MessageSquare} iconColor="bg-error-500" />
              <StatCard
                title={t("admin_analytics_stat_revenue", "Mapato Yaliyokamilika")}
                value={`TZS ${(data.revenueTotal ?? 0).toLocaleString()}`}
                icon={DollarSign}
                iconColor="bg-amber-500"
              />
            </div>
            <div className="grid grid-cols-1 gap-6">
              <BarChartCard title={t("admin_analytics_chart_complaints", "Malalamiko kwa Hali")} data={toChartData(data.complaintsByStatus)} />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
