import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, Clock, MapPin, Info } from "lucide-react";
import { DashboardLayout } from "../components/layout";
import { getMySchedule, type ScheduleEntry } from "../services/scheduleService";

const dayLabelKey: Record<string, string> = {
  monday: "sched_day_monday",
  tuesday: "sched_day_tuesday",
  wednesday: "sched_day_wednesday",
  thursday: "sched_day_thursday",
  friday: "sched_day_friday",
  saturday: "sched_day_saturday",
  sunday: "sched_day_sunday",
};

export default function SchedulesPage() {
  const { t } = useTranslation();
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [isPersonalized, setIsPersonalized] = useState(true);
  const [wardName, setWardName] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getMySchedule();
        setSchedules(data.schedules);
        setIsPersonalized(data.isPersonalized);
        setWardName(data.wardName);
      } catch (err) {
        console.error(err);
        setError(t("sched_load_failed", "Imeshindikana kupakia ratiba"));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            {t("sched_title", "Ratiba ya Ukusanyaji Taka")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {isPersonalized && wardName
              ? t("sched_subtitle_ward", "Ratiba ya kata: {{ward}}", { ward: wardName })
              : t("sched_subtitle_general", "Ratiba ya ukusanyaji taka katika eneo lako")}
          </p>
        </div>

        {!isPersonalized && !loading && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-300">
              {t(
                "sched_no_ward_note",
                "Bado hujaweka kata (ward) yako kwenye wasifu wako. Tunakuonyesha ratiba ya jumla ya manispaa yako. Sasisha wasifu wako ili uone ratiba maalum ya eneo lako."
              )}
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl">
            <p className="text-red-500">{error}</p>
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">
              {t("sched_none_found", "Hakuna ratiba iliyowekwa kwa eneo lako bado.")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedules.map((s) => (
              <div
                key={s.id}
                className="bg-white dark:bg-slate-800 rounded-xl shadow p-5 border-l-4"
                style={{ borderLeftColor: s.waste_category_color || "#10b981" }}
              >
                <p className="text-lg font-bold text-secondary-900 dark:text-white">
                  {t(dayLabelKey[s.collection_day?.toLowerCase()] ?? "", s.collection_day)}
                </p>

                <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{s.zone_name}</span>
                  </div>
                  {(s.start_time || s.end_time) && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>
                        {s.start_time?.slice(0, 5)}
                        {s.end_time ? ` – ${s.end_time.slice(0, 5)}` : ""}
                      </span>
                    </div>
                  )}
                  {s.waste_category_name && (
                    <span
                      className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: (s.waste_category_color ?? "#10b981") + "20",
                        color: s.waste_category_color ?? "#10b981",
                      }}
                    >
                      {s.waste_category_name}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}