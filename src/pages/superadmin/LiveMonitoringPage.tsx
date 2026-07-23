import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Truck, AlertTriangle, Route as RouteIcon, RefreshCw, Flame, Trash } from "lucide-react";
import { SuperAdminLayout } from "../../components/layout/SuperAdminLayout";
import { DataTable, StatCard } from "../../components/dashboard";
import { Badge, Button } from "../../components/common";
import {
  getLiveVehicles,
  getBinAlerts,
  getActiveRoutes,
  type LiveVehicle,
  type LiveBinAlert,
  type LiveRoute,
} from "../../services/liveMonitoringService";

const vehicleStatusVariant: Record<string, "success" | "info" | "warning" | "error"> = {
  available: "success",
  on_route: "info",
  maintenance: "warning",
  inactive: "error",
};

const routeStatusVariant: Record<string, "default" | "info" | "success" | "error"> = {
  pending: "default",
  in_progress: "info",
  completed: "success",
  cancelled: "error",
};

export default function LiveMonitoringPage() {
  const { t } = useTranslation();

  const [vehicles, setVehicles] = useState<LiveVehicle[]>([]);
  const [binAlerts, setBinAlerts] = useState<LiveBinAlert[]>([]);
  const [routes, setRoutes] = useState<LiveRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const loadData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const [v, b, r] = await Promise.all([getLiveVehicles(), getBinAlerts(), getActiveRoutes()]);
        setVehicles(v);
        setBinAlerts(b);
        setRoutes(r);
        setLastRefresh(new Date());
      } catch (err) {
        console.error(err);
        toast.error(t("superadmin_livemon_load_failed"));
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const onRouteVehicles = vehicles.filter((v) => v.status === "on_route").length;

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
              {t("superadmin_nav_live")}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              {t("superadmin_livemon_subtitle")} · {t("superadmin_livemon_last_refresh")}{" "}
              {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          <Button variant="secondary" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={() => loadData()}>
            {t("superadmin_livemon_refresh")}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title={t("superadmin_livemon_stat_on_route")}
            value={onRouteVehicles}
            icon={Truck}
            iconColor="bg-blue-500"
          />
          <StatCard
            title={t("superadmin_livemon_stat_bin_alerts")}
            value={binAlerts.length}
            icon={AlertTriangle}
            iconColor="bg-red-500"
          />
          <StatCard
            title={t("superadmin_livemon_stat_active_routes")}
            value={routes.length}
            icon={RouteIcon}
            iconColor="bg-emerald-500"
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-3 flex items-center gap-2">
            <Truck className="w-5 h-5" /> {t("superadmin_livemon_vehicles_title")}
          </h2>
          <DataTable<LiveVehicle>
            isLoading={loading}
            data={vehicles}
            keyExtractor={(v) => v.id}
            columns={[
              {
                key: "registration_number",
                header: t("superadmin_livemon_col_vehicle"),
                render: (v) => (
                  <div>
                    <p className="font-medium text-secondary-900 dark:text-white">{v.registration_number}</p>
                    <p className="text-xs text-slate-400">{v.company_name || "—"}</p>
                  </div>
                ),
              },
              {
                key: "status",
                header: t("superadmin_livemon_col_status"),
                render: (v) => (
                  <Badge variant={vehicleStatusVariant[v.status] || "default"} dot>
                    {t(`superadmin_analytics_vehicle_status_${v.status}`)}
                  </Badge>
                ),
              },
              {
                key: "driver_name",
                header: t("superadmin_livemon_col_driver"),
                render: (v) => v.driver_name || t("superadmin_support_unassigned"),
              },
              {
                key: "location",
                header: t("superadmin_livemon_col_location"),
                render: (v) =>
                  v.current_latitude && v.current_longitude
                    ? `${v.current_latitude.toFixed(4)}, ${v.current_longitude.toFixed(4)}`
                    : t("superadmin_livemon_no_location"),
              },
              {
                key: "last_location_update",
                header: t("superadmin_livemon_col_updated"),
                render: (v) =>
                  v.last_location_update ? new Date(v.last_location_update).toLocaleString() : "—",
              },
            ]}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" /> {t("superadmin_livemon_bins_title")}
          </h2>
          <DataTable<LiveBinAlert>
            isLoading={loading}
            data={binAlerts}
            keyExtractor={(b) => b.id}
            emptyState={
              <div className="text-center py-10">
                <Trash className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">{t("superadmin_livemon_no_bin_alerts")}</p>
              </div>
            }
            columns={[
              { key: "bin_code", header: t("superadmin_livemon_col_bin"), render: (b) => b.bin_code },
              {
                key: "fill_level",
                header: t("superadmin_livemon_col_fill"),
                render: (b) => (
                  <Badge variant={b.fill_level >= 90 ? "error" : "warning"}>{b.fill_level}%</Badge>
                ),
              },
              {
                key: "alerts",
                header: t("superadmin_livemon_col_alert"),
                render: (b) => (
                  <div className="flex gap-2">
                    {b.has_fire_alert && (
                      <Badge variant="error">
                        <Flame className="w-3 h-3 mr-1 inline" /> {t("superadmin_livemon_fire_alert")}
                      </Badge>
                    )}
                    {b.has_overflow_alert && (
                      <Badge variant="warning">{t("superadmin_livemon_overflow_alert")}</Badge>
                    )}
                    {!b.has_fire_alert && !b.has_overflow_alert && (
                      <Badge variant="warning">{t("superadmin_livemon_almost_full")}</Badge>
                    )}
                  </div>
                ),
              },
              {
                key: "battery_level",
                header: t("superadmin_livemon_col_battery"),
                render: (b) => `${b.battery_level}%`,
              },
              {
                key: "last_emptied_at",
                header: t("superadmin_livemon_col_last_emptied"),
                render: (b) => (b.last_emptied_at ? new Date(b.last_emptied_at).toLocaleDateString() : "—"),
              },
            ]}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-3 flex items-center gap-2">
            <RouteIcon className="w-5 h-5" /> {t("superadmin_livemon_routes_title")}
          </h2>
          <DataTable<LiveRoute>
            isLoading={loading}
            data={routes}
            keyExtractor={(r) => r.id}
            columns={[
              {
                key: "name",
                header: t("superadmin_livemon_col_route"),
                render: (r) => r.name || `#${r.id.slice(0, 8)}`,
              },
              {
                key: "status",
                header: t("superadmin_livemon_col_status"),
                render: (r) => (
                  <Badge variant={routeStatusVariant[r.status] || "default"} dot>
                    {t(`superadmin_analytics_route_status_${r.status}`)}
                  </Badge>
                ),
              },
              {
                key: "driver_name",
                header: t("superadmin_livemon_col_driver"),
                render: (r) => r.driver_name || t("superadmin_support_unassigned"),
              },
              {
                key: "vehicle_registration",
                header: t("superadmin_livemon_col_vehicle"),
                render: (r) => r.vehicle_registration || "—",
              },
              {
                key: "total_stops",
                header: t("superadmin_livemon_col_stops"),
                render: (r) => r.total_stops ?? "—",
              },
              {
                key: "scheduled_date",
                header: t("superadmin_livemon_col_scheduled"),
                render: (r) => (r.scheduled_date ? new Date(r.scheduled_date).toLocaleDateString() : "—"),
              },
            ]}
          />
        </div>
      </div>
    </SuperAdminLayout>
  );
}
