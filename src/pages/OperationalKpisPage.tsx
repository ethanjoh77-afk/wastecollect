import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Fuel, DollarSign, AlertTriangle, PackageX, RefreshCw, CheckCircle2 } from "lucide-react";
import { DashboardLayout } from "../components/layout";
import { StatCard } from "../components/dashboard";
import { Button } from "../components/common";
import { supabase } from "../lib/supabase";
import {
  createFuelLog,
  getCompanyOperationalKpis,
  getRouteCostSummaries,
  type RouteCostSummary,
  type CompanyOperationalKpis,
} from "../services/costTrackingService";
import {
  detectStaleVehicles,
  listUnresolvedAlerts,
  resolveAlert,
  type VehicleAlert,
} from "../services/operationalAlertsService";

/**
 * Operational KPIs — hii ndiyo ukurasa unaojibu moja kwa moja maswali
 * ya market validation #6 (differentiation dhidi ya weighbridge), #7
 * (GPS kama decision-support), na #8 (ROI inayopimika ndani ya siku 30).
 *
 * Inatumika na company_admin (mteja anayelipa) na super_admin.
 */
export default function OperationalKpisPage() {
  const { t } = useTranslation();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<CompanyOperationalKpis | null>(null);
  const [routes, setRoutes] = useState<RouteCostSummary[]>([]);
  const [alerts, setAlerts] = useState<VehicleAlert[]>([]);
  const [checkingDeviation, setCheckingDeviation] = useState(false);

  const [fuelForm, setFuelForm] = useState({ vehicle_id: "", route_id: "", liters: "", cost_amount: "" });
  const [savingFuel, setSavingFuel] = useState(false);
  const [vehicles, setVehicles] = useState<{ id: string; registration_number: string }[]>([]);

  const resolveMyCompany = useCallback(async (): Promise<string | null> => {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) return null;

    const { data: profile } = await supabase.from("users").select("role").eq("id", userId).single();

    if (profile?.role === "company_admin") {
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("admin_id", userId)
        .maybeSingle();
      return company?.id ?? null;
    }

    if (profile?.role === "super_admin") {
      const { data: anyCompany } = await supabase.from("companies").select("id").limit(1).maybeSingle();
      return anyCompany?.id ?? null;
    }

    return null;
  }, []);

  const loadAll = useCallback(async (cid: string) => {
    setLoading(true);
    try {
      const [kpiRes, routeRes, alertRes, vehicleRes] = await Promise.all([
        getCompanyOperationalKpis(cid),
        getRouteCostSummaries(cid),
        listUnresolvedAlerts(cid),
        supabase.from("vehicles").select("id, registration_number").eq("company_id", cid),
      ]);
      setKpis(kpiRes);
      setRoutes(routeRes);
      setAlerts(alertRes);
      setVehicles(vehicleRes.data ?? []);
    } catch (err) {
      console.error(err);
      toast.error(t("kpis_load_failed", "Imeshindikana kupakia takwimu za uendeshaji"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    (async () => {
      const cid = await resolveMyCompany();
      setCompanyId(cid);
      if (cid) await loadAll(cid);
      else setLoading(false);
    })();
  }, [resolveMyCompany, loadAll]);

  async function handleRunDeviationCheck() {
    if (!companyId) return;
    setCheckingDeviation(true);
    try {
      const created = await detectStaleVehicles(companyId);
      if (created.length > 0) {
        toast.success(t("kpis_new_alerts", `Alerts mpya ${created.length} zimegunduliwa`));
      } else {
        toast.success(t("kpis_no_new_alerts", "Hakuna tatizo jipya la GPS lililogundulika"));
      }
      await loadAll(companyId);
    } catch (err) {
      console.error(err);
      toast.error(t("kpis_deviation_failed", "Imeshindikana kufanya ukaguzi wa GPS"));
    } finally {
      setCheckingDeviation(false);
    }
  }

  async function handleResolveAlert(alertId: string) {
    try {
      await resolveAlert(alertId);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch (err) {
      console.error(err);
      toast.error(t("kpis_resolve_failed", "Imeshindikana kufunga alert"));
    }
  }

  async function handleSaveFuelLog(e: React.FormEvent) {
    e.preventDefault();
    if (!companyId || !fuelForm.vehicle_id || !fuelForm.liters || !fuelForm.cost_amount) return;

    setSavingFuel(true);
    try {
      await createFuelLog({
        company_id: companyId,
        vehicle_id: fuelForm.vehicle_id,
        route_id: fuelForm.route_id || null,
        liters: Number(fuelForm.liters),
        cost_amount: Number(fuelForm.cost_amount),
      });
      toast.success(t("kpis_fuel_saved", "Rekodi ya mafuta imehifadhiwa"));
      setFuelForm({ vehicle_id: "", route_id: "", liters: "", cost_amount: "" });
      await loadAll(companyId);
    } catch (err) {
      console.error(err);
      toast.error(t("kpis_fuel_save_failed", "Imeshindikana kuhifadhi rekodi ya mafuta"));
    } finally {
      setSavingFuel(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!companyId) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 text-center gap-2">
          <DollarSign className="w-10 h-10 text-slate-300" />
          <p className="text-slate-500">
            {t("kpis_no_scope", "Bado hujapangiwa kampuni — wasiliana na Super Admin.")}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              {t("kpis_title", "Operational KPIs")}
            </h1>
            <p className="text-sm text-slate-500">
              {t("kpis_subtitle", "Gharama, ufanisi wa routes, na tahadhari za GPS — namba za kuonyesha ROI.")}
            </p>
          </div>
          <Button onClick={handleRunDeviationCheck} disabled={checkingDeviation}>
            <RefreshCw className={`w-4 h-4 mr-2 ${checkingDeviation ? "animate-spin" : ""}`} />
            {t("kpis_run_check", "Kagua Magari (GPS)")}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t("kpis_fuel_cost_month", "Gharama ya Mafuta (Mwezi huu)")}
            value={`TSh ${kpis?.totalFuelCostThisMonth.toLocaleString() ?? 0}`}
            icon={Fuel}
            iconColor="bg-orange-500"
          />
          <StatCard
            title={t("kpis_pickups_month", "Pickups Zilizokamilika")}
            value={kpis?.totalPickupsThisMonth ?? 0}
            icon={CheckCircle2}
            iconColor="bg-green-500"
          />
          <StatCard
            title={t("kpis_cost_per_pickup", "Gharama kwa Pickup")}
            value={kpis?.averageCostPerPickup != null ? `TSh ${kpis.averageCostPerPickup.toLocaleString()}` : "—"}
            icon={DollarSign}
            iconColor="bg-blue-500"
          />
          <StatCard
            title={t("kpis_missed_rate", "Missed Pickup Rate")}
            value={kpis?.missedPickupRate != null ? `${kpis.missedPickupRate}%` : "—"}
            icon={PackageX}
            iconColor="bg-red-500"
          />
        </div>

        {/* Unresolved GPS alerts */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            {t("kpis_alerts_title", "Tahadhari za GPS Zisizofungwa")} ({alerts.length})
          </h2>
          {alerts.length === 0 ? (
            <p className="text-sm text-slate-400">{t("kpis_no_alerts", "Hakuna tahadhari kwa sasa.")}</p>
          ) : (
            <ul className="space-y-2">
              {alerts.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 rounded-lg px-4 py-3"
                >
                  <span className="text-sm text-slate-700 dark:text-slate-200">{a.message}</span>
                  <button
                    onClick={() => handleResolveAlert(a.id)}
                    className="text-xs font-medium text-primary-600 hover:underline shrink-0 ml-3"
                  >
                    {t("kpis_resolve", "Funga")}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Route cost table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 overflow-x-auto">
          <h2 className="font-semibold text-slate-800 dark:text-white mb-3">
            {t("kpis_route_costs", "Gharama kwa Kila Route")}
          </h2>
          {routes.length === 0 ? (
            <p className="text-sm text-slate-400">{t("kpis_no_routes", "Hakuna routes bado.")}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100 dark:border-slate-700">
                  <th className="py-2 pr-4">{t("kpis_col_route", "Route")}</th>
                  <th className="py-2 pr-4">{t("kpis_col_date", "Tarehe")}</th>
                  <th className="py-2 pr-4">{t("kpis_col_completed", "Kamilika")}</th>
                  <th className="py-2 pr-4">{t("kpis_col_skipped", "Skipped")}</th>
                  <th className="py-2 pr-4">{t("kpis_col_fuel", "Gharama Mafuta")}</th>
                  <th className="py-2 pr-4">{t("kpis_col_cost_pickup", "Kwa Pickup")}</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((r) => (
                  <tr key={r.route_id} className="border-b border-slate-50 dark:border-slate-700/50">
                    <td className="py-2 pr-4">{r.route_name ?? "—"}</td>
                    <td className="py-2 pr-4">{r.scheduled_date ?? "—"}</td>
                    <td className="py-2 pr-4">{r.completed_stops}</td>
                    <td className="py-2 pr-4">{r.skipped_stops}</td>
                    <td className="py-2 pr-4">TSh {r.total_fuel_cost.toLocaleString()}</td>
                    <td className="py-2 pr-4">
                      {r.cost_per_completed_pickup != null ? `TSh ${r.cost_per_completed_pickup.toLocaleString()}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Quick fuel log form */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
            <Fuel className="w-5 h-5 text-orange-500" />
            {t("kpis_add_fuel", "Ongeza Rekodi ya Mafuta")}
          </h2>
          <form onSubmit={handleSaveFuelLog} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">{t("kpis_form_vehicle", "Gari")}</label>
              <select
                className="border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent"
                value={fuelForm.vehicle_id}
                onChange={(e) => setFuelForm((f) => ({ ...f, vehicle_id: e.target.value }))}
                required
              >
                <option value="">{t("kpis_form_select", "Chagua...")}</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registration_number}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">{t("kpis_form_liters", "Lita")}</label>
              <input
                type="number"
                step="0.01"
                className="border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent"
                value={fuelForm.liters}
                onChange={(e) => setFuelForm((f) => ({ ...f, liters: e.target.value }))}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">{t("kpis_form_cost", "Gharama (TSh)")}</label>
              <input
                type="number"
                step="0.01"
                className="border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent"
                value={fuelForm.cost_amount}
                onChange={(e) => setFuelForm((f) => ({ ...f, cost_amount: e.target.value }))}
                required
              />
            </div>
            <Button type="submit" disabled={savingFuel}>
              {savingFuel ? t("kpis_saving", "Inahifadhi...") : t("kpis_save", "Hifadhi")}
            </Button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
