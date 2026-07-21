import { useTranslation } from 'react-i18next';
import {
  Building2,
  Users,
  Truck,
  UserCog,
  FileText,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Activity as ActivityIcon,
  Radio,
  Database,
  Circle,
} from 'lucide-react';
import { SuperAdminLayout } from '../../components/layout/SuperAdminLayout';
import { StatCard } from '../../components/dashboard';
import { useSuperAdminStats } from '../../hooks/useSuperAdminStats';

export default function SuperAdminDashboardPage() {
  const { t } = useTranslation();
  const { stats, dbHealth, loading } = useSuperAdminStats();

  const healthColor =
    dbHealth?.status === 'operational'
      ? 'text-green-500'
      : dbHealth?.status === 'degraded'
      ? 'text-amber-500'
      : 'text-red-500';

  const healthLabel =
    dbHealth?.status === 'operational'
      ? t('superadmin_health_operational')
      : dbHealth?.status === 'degraded'
      ? t('superadmin_health_degraded')
      : t('superadmin_health_down');

  return (
    <SuperAdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">
              {t('superadmin_dashboard_title')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              {t('superadmin_dashboard_subtitle')}
            </p>
          </div>

          {/* System health — kipimo halisi cha database, si namba ya kubuni */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <Database className={`w-4 h-4 ${healthColor}`} />
            <span className={`text-sm font-medium ${healthColor}`}>{healthLabel}</span>
            {dbHealth && (
              <span className="text-xs text-slate-400">· {dbHealth.latencyMs}ms</span>
            )}
          </div>
        </div>

        {/* Platform-wide stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard
            title={t('superadmin_stat_companies')}
            value={loading ? '...' : stats.totalCompanies}
            icon={Building2}
            iconColor="bg-amber-500"
          />
          <StatCard
            title={t('superadmin_stat_citizens')}
            value={loading ? '...' : stats.totalCitizens}
            icon={Users}
            iconColor="bg-blue-500"
          />
          <StatCard
            title={t('superadmin_stat_drivers')}
            value={loading ? '...' : stats.totalDrivers}
            icon={Truck}
            iconColor="bg-green-500"
          />
          <StatCard
            title={t('superadmin_stat_admins')}
            value={loading ? '...' : stats.totalAdmins}
            icon={UserCog}
            iconColor="bg-purple-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard
            title={t('superadmin_stat_requests')}
            value={loading ? '...' : stats.totalRequests}
            icon={FileText}
            iconColor="bg-orange-500"
          />
          <StatCard
            title={t('superadmin_stat_revenue')}
            value={loading ? '...' : `TZS ${stats.totalRevenue.toLocaleString()}`}
            icon={Wallet}
            iconColor="bg-emerald-500"
          />
          <StatCard
            title={t('superadmin_stat_pending_complaints')}
            value={loading ? '...' : stats.pendingComplaints}
            icon={AlertCircle}
            iconColor="bg-red-500"
          />
          <StatCard
            title={t('superadmin_stat_completed_collections')}
            value={loading ? '...' : stats.completedCollections}
            icon={CheckCircle2}
            iconColor="bg-teal-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard
            title={t('superadmin_stat_active_vehicles')}
            value={loading ? '...' : stats.activeVehicles}
            icon={Radio}
            iconColor="bg-cyan-500"
          />
          <StatCard
            title={t('superadmin_stat_online_users')}
            value={loading ? '...' : stats.onlineUsers}
            icon={ActivityIcon}
            iconColor="bg-indigo-500"
          />
          <StatCard
            title={t('superadmin_stat_payments')}
            value={loading ? '...' : stats.totalPayments}
            icon={Wallet}
            iconColor="bg-lime-500"
          />
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col justify-center items-center gap-2">
            <Circle className={`w-3 h-3 ${healthColor} fill-current`} />
            <p className="text-xs text-center text-slate-500 dark:text-slate-400">
              {t('superadmin_health_note')}
            </p>
          </div>
        </div>

        {/* Sehemu za awamu zijazo */}
        <div className="p-6 rounded-2xl bg-amber-50 dark:bg-slate-800/50 border border-amber-200 dark:border-slate-700">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            {t('superadmin_phase_note')}
          </p>
        </div>
      </div>
    </SuperAdminLayout>
  );
}