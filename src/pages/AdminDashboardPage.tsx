import TruckMap from "../components/maps/TruckMap";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Users,
  Truck,
  FileText,
  DollarSign,
  Mail,
} from "lucide-react";
import { DashboardLayout } from "../components/layout";
import { StatCard } from "../components/dashboard";
import { ActivityFeed } from "../components/dashboard/ActivityFeed";
import ReportMap from "../components/maps/ReportMap";
import { getAdminStats } from "../services/adminService";
import { supabase } from "../lib/supabase";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    users: 0,
    reports: 0,
    vehicles: 0,
    revenue: 0,
  });

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  useEffect(() => {
    loadStats();
    loadMessages();

    const channel = supabase
      .channel("admin-contact-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "contact_messages" },
        () => loadMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  async function loadMessages() {
    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("id, name, email, message, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setMessages(data ?? []);
    } catch (error) {
      console.error("Failed to load contact messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
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
            Truck Tracking - {t('admin_live_truck_tracking')}
          </h2>
          <TruckMap />
        </div>
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
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
              <h2 className="text-xl font-bold mb-4 text-secondary-900 dark:text-white">
                Waste Map - {t('admin_live_waste_map')}
              </h2>
              <ReportMap />
            </div>
          </div>
          <div>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
              <h2 className="text-xl font-bold mb-4 text-secondary-900 dark:text-white">
                Activities - {t('admin_live_activities')}
              </h2>
              <ActivityFeed />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-secondary-900 dark:text-white flex items-center gap-2">
              <Mail className="w-5 h-5" />
              {t('admin_contact_messages')}
            </h2>
            <div className="flex items-center gap-3">
              {messages.length > 0 && (
                <span className="text-sm px-3 py-1 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 font-medium">
                  {messages.length}
                </span>
              )}
              <button
                onClick={() => navigate("/admin/support")}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium"
              >
                {t('csm_view_all', 'Ona Zote')}
              </button>
            </div>
          </div>

          {loadingMessages ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm">{t('loading')}</p>
          ) : messages.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm">{t('admin_no_messages')}</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-secondary-900 dark:text-white">
                      {msg.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(msg.created_at).toLocaleString("sw-TZ")}
                    </span>
                  </div>
                  <a href={`mailto:${msg.email}`} className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                    {msg.email}
                  </a>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                    {msg.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}