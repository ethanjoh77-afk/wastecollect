import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Recycle, MapPin, Phone, Award, Leaf, Plus } from "lucide-react";
import { DashboardLayout } from "../components/layout";
import { Button, Input, Select, Modal, EmptyState } from "../components/common";
import { StatCard } from "../components/dashboard";
import {
  getRecyclableCategories,
  getRecyclingCenters,
  getMyRecyclingRecords,
  getMyRecyclingStats,
  logRecycling,
  type WasteCategory,
  type RecyclingCenter,
  type RecyclingRecord,
  type RecyclingStats,
} from "../services/recyclingService";

const emptyStats: RecyclingStats = { totalKg: 0, totalPoints: 0, totalSubmissions: 0, byCategory: [] };

export default function RecyclingPage() {
  const { t } = useTranslation();

  const [categories, setCategories] = useState<WasteCategory[]>([]);
  const [centers, setCenters] = useState<RecyclingCenter[]>([]);
  const [records, setRecords] = useState<RecyclingRecord[]>([]);
  const [stats, setStats] = useState<RecyclingStats>(emptyStats);
  const [loading, setLoading] = useState(true);

  const [logOpen, setLogOpen] = useState(false);
  const [form, setForm] = useState({ waste_category_id: "", quantity_kg: "", recycling_center_id: "" });
  const [saving, setSaving] = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const [categoriesData, centersData, recordsData, statsData] = await Promise.all([
        getRecyclableCategories(),
        getRecyclingCenters(),
        getMyRecyclingRecords(),
        getMyRecyclingStats(),
      ]);
      setCategories(categoriesData);
      setCenters(centersData);
      setRecords(recordsData);
      setStats(statsData);
    } catch (err) {
      console.error(err);
      toast.error(t("recycling_load_failed", "Imeshindikana kupakia data ya urejelezaji"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogSubmit(e: React.FormEvent) {
    e.preventDefault();
    const quantity = Number(form.quantity_kg);
    if (!form.waste_category_id || !quantity || quantity <= 0) {
      toast.error(t("recycling_form_invalid", "Chagua aina ya taka na weka uzito sahihi"));
      return;
    }

    setSaving(true);
    try {
      await logRecycling({
        waste_category_id: form.waste_category_id,
        quantity_kg: quantity,
        recycling_center_id: form.recycling_center_id || undefined,
      });
      toast.success(t("recycling_logged", "Umefanikiwa kurekodi urejelezaji wako!"));
      setLogOpen(false);
      setForm({ waste_category_id: "", quantity_kg: "", recycling_center_id: "" });
      loadAll();
    } catch (err: any) {
      toast.error(err?.message ?? t("recycling_log_failed", "Imeshindikana kurekodi"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-white flex items-center gap-2">
              <Recycle className="w-6 h-6 text-success-500" />
              {t("nav_recycling", "Urejelezaji")}
            </h1>
            <p className="text-sm text-secondary-500 dark:text-secondary-400">
              {t("recycling_subtitle", "Rekodi urejelezaji wako na upate pointi za mazingira")}
            </p>
          </div>
          <Button onClick={() => setLogOpen(true)}>
            <Plus className="w-4 h-4" /> {t("recycling_log_btn", "Rekodi Urejelezaji")}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard title={t("recycling_stat_total_kg", "Jumla ya Kilo")} value={loading ? "—" : `${stats.totalKg.toFixed(1)} kg`} icon={Leaf} iconColor="bg-success-500" />
          <StatCard title={t("recycling_stat_points", "Pointi za Mazingira")} value={loading ? "—" : stats.totalPoints} icon={Award} iconColor="bg-primary-500" />
          <StatCard title={t("recycling_stat_submissions", "Marekodi")} value={loading ? "—" : stats.totalSubmissions} icon={Recycle} iconColor="bg-secondary-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* RECYCLING CENTERS */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6">
            <h2 className="font-semibold text-secondary-900 dark:text-white mb-4">
              {t("recycling_centers_title", "Vituo vya Urejelezaji")}
            </h2>
            {centers.length === 0 ? (
              <p className="text-sm text-secondary-400">{t("recycling_no_centers", "Hakuna vituo vilivyosajiliwa bado")}</p>
            ) : (
              <div className="space-y-3">
                {centers.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl border border-secondary-100 dark:border-slate-700">
                    <p className="font-medium text-secondary-900 dark:text-white">{c.name}</p>
                    {c.address && (
                      <p className="text-xs text-secondary-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" /> {c.address}
                      </p>
                    )}
                    {c.contact_phone && (
                      <p className="text-xs text-secondary-500 flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3" /> {c.contact_phone}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* HISTORY */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6">
            <h2 className="font-semibold text-secondary-900 dark:text-white mb-4">
              {t("recycling_history_title", "Historia Yangu")}
            </h2>
            {loading ? (
              <p className="text-sm text-secondary-400">{t("loading", "Inapakia...")}</p>
            ) : records.length === 0 ? (
              <EmptyState icon={Recycle} title={t("recycling_no_records", "Bado hujarekodi urejelezaji wowote")} description="" />
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {records.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-xl border border-secondary-100 dark:border-slate-700">
                    <div>
                      <p className="font-medium text-secondary-900 dark:text-white text-sm">{r.category_name ?? "—"}</p>
                      <p className="text-xs text-secondary-500">
                        {r.quantity_kg} kg · {new Date(r.created_at).toLocaleDateString("sw-TZ")}
                        {r.center_name && ` · ${r.center_name}`}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-success-600 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" /> +{r.points_earned}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={logOpen} onClose={() => setLogOpen(false)} title={t("recycling_log_title", "Rekodi Urejelezaji Wako")} size="md">
        <form onSubmit={handleLogSubmit} className="space-y-4">
          <Select
            label={t("recycling_category_label", "Aina ya Taka")}
            placeholder={t("recycling_category_placeholder", "Chagua aina")}
            value={form.waste_category_id}
            onChange={(e) => setForm({ ...form, waste_category_id: e.target.value })}
            options={categories.map((c) => ({ value: c.id, label: `${c.name} (+${c.points_per_kg} pts/kg)` }))}
            required
          />
          <Input
            label={t("recycling_quantity_label", "Uzito (kg)")}
            type="number"
            min="0.1"
            step="0.1"
            value={form.quantity_kg}
            onChange={(e) => setForm({ ...form, quantity_kg: e.target.value })}
            required
          />
          <Select
            label={t("recycling_center_label", "Kituo cha Urejelezaji (hiari)")}
            placeholder={t("recycling_center_placeholder", "Bila kituo maalum")}
            value={form.recycling_center_id}
            onChange={(e) => setForm({ ...form, recycling_center_id: e.target.value })}
            options={centers.map((c) => ({ value: c.id, label: c.name }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setLogOpen(false)}>
              {t("csm_cancel", "Ghairi")}
            </Button>
            <Button type="submit" isLoading={saving}>
              {t("recycling_submit_btn", "Hifadhi")}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
