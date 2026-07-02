import TruckMap from "../components/maps/TruckMap";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Users,
  Truck,
  FileText,
  DollarSign,
} from "lucide-react";
import { DashboardLayout } from "../components/layout";
import { StatCard } from "../components/dashboard";
import { ActivityFeed } from "../components/dashboard/ActivityFeed";
import ReportMap from "../components/maps/ReportMap";
import { getAdminStats } from "../services/adminService";

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    users: 0,
    reports: 0,
    vehicles: 0,
    revenue: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const data = await getAdminStats();
      setStats({
        users: data.users,
        reports: data.reports,
        vehicles: data.vehicles,
        revenue: data.revenue,
      });
    } catch (error) {
      console.error("Failed to load admin stats:", error);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">
            {t('admin_dashboard_title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {t('admin_dashboard_subtitle')}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-secondary-900 dark:text-white">
            🚛 {t('admin_live_truck_tracking')}
          </h2>
          <TruckMap />
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard
            title={t('admin_stat_users')}
            value={stats.users}
            icon={Users}
            iconColor="bg-blue-500"
          />
          <StatCard
            title={t('admin_stat_reports')}
            value={stats.reports}
            icon={FileText}
            iconColor="bg-orange-500"
          />
          <StatCard
            title={t('admin_stat_vehicles')}
            value={stats.vehicles}
            icon={Truck}
            iconColor="bg-green-500"
          />
          <StatCard
            title={t('admin_stat_revenue')}
            value={`TZS ${stats.revenue.toLocaleString()}`}
            icon={DollarSign}
            iconColor="bg-emerald-500"
          />
        </div>

        {/* Map + Activity */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
              <h2 className="text-xl font-bold mb-4 text-secondary-900 dark:text-white">
                🗺️ {t('admin_live_waste_map')}
              </h2>
              <ReportMap />
            </div>
          </div>
          <div>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
              <h2 className="text-xl font-bold mb-4 text-secondary-900 dark:text-white">
                🔔 {t('admin_live_activities')}
              </h2>
              <ActivityFeed />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}