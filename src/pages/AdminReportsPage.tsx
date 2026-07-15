import { useEffect, useRef, useState } from "react";
import { DashboardLayout } from "../components/layout";
import { supabase } from "../lib/supabase";
import { debounce } from "../lib/debounce";
import { useTranslation } from "react-i18next";

type Report = {
  id: string;
  report_type: string;
  description: string;
  address: string;
  status: string;
  created_at: string;
  assigned_to: string | null;
  photos?: string[];
  driver_issue_note?: string | null;
  issue_reported_at?: string | null;
  decline_note?: string | null;
  declined_at?: string | null;
};

type Driver = {
  id: string;
  first_name: string;
  last_name: string;
};

export default function AdminReportsPage() {
  const { t } = useTranslation();
  const [reports, setReports] = useState<Report[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [reassignTarget, setReassignTarget] = useState<Record<string, string>>({});

  const debouncedLoadReports = useRef(debounce(loadReports, 1000)).current;

  useEffect(() => {
    loadReports();
    loadDrivers();

    const channel = supabase
      .channel("admin-reports")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "waste_reports" },
        () => { debouncedLoadReports(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadDrivers() {
    const { data } = await supabase
      .from("users")
      .select("id, first_name, last_name")
      .eq("role", "driver");
    if (data) setDrivers(data);
  }

  async function loadReports() {
    setLoading(true);
    const { data, error } = await supabase
      .from("waste_reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setReports(data);
    setLoading(false);
  }

  async function assignDriver(reportId: string, driverId: string) {
    const { error } = await supabase
      .from("waste_reports")
      .update({
        assigned_to: driverId,
        status: "assigned",
        decline_note: null,
        declined_at: null,
        declined_by: null,
      })
      .eq("id", reportId);
    if (error) { alert(error.message); return; }
    loadReports();
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase
      .from("waste_reports")
      .update({ status })
      .eq("id", id);
    if (error) { alert(error.message); return; }
    loadReports();
  }

  // ================= CONFIRM ISSUE + REASSIGN TO NEW DRIVER =================
  async function confirmAndReassign(reportId: string) {
    const newDriverId = reassignTarget[reportId];
    if (!newDriverId) {
      alert(t('admin_reports_pick_driver_first', 'Chagua dereva mpya kwanza.'));
      return;
    }

    const { error } = await supabase.rpc('confirm_and_reassign_report', {
      p_report_id: reportId,
      p_new_driver_id: newDriverId,
    });

    if (error) {
      alert(error.message);
      return;
    }

    loadReports();
  }

  function badgeColor(status: string) {
    switch (status) {
      case "resolved": return "bg-green-500";
      case "in_progress": return "bg-yellow-500";
      case "assigned": return "bg-blue-500";
      case "issue_reported": return "bg-red-500";
      default: return "bg-gray-400";
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('admin_reports_title')}</h1>
          <p className="text-gray-500">{t('admin_reports_subtitle')}</p>
        </div>

        {loading ? (
          <p className="text-gray-500">{t('admin_reports_loading')}</p>
        ) : reports.length === 0 ? (
          <p className="text-gray-500">{t('admin_reports_none_found')}</p>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              className={`bg-white rounded-xl shadow-lg p-6 ${
                report.status === "issue_reported" ? "ring-2 ring-red-400" : ""
              }`}
            >
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  {report.photos && report.photos.length > 0 ? (
                    <img
                      src={report.photos[0]}
                      alt="Waste"
                      className="w-full h-56 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-full h-56 rounded-xl bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">{t('admin_reports_no_photo')}</span>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div>
                    <h2 className="text-xl font-bold capitalize">
                      {report.report_type.replaceAll("_", " ")}
                    </h2>
                    <p className="mt-2">{report.description}</p>
                    <p className="text-gray-600 mt-2">📍 {report.address}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(report.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <span className={`${badgeColor(report.status)} text-white px-4 py-2 rounded-full`}>
                      {report.status.replaceAll("_", " ")}
                    </span>
                  </div>

                  {/* ===== DRIVER DECLINED ALERT ===== */}
                  {report.status === "pending" && !report.assigned_to && report.decline_note && (
                    <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
                      <p className="font-semibold text-amber-700">
                        🚫 {t('admin_reports_declined_title', 'Dereva aliyekuwa amepangiwa amekataa kazi hii')}
                      </p>
                      <p className="text-amber-700 text-sm mt-1">{report.decline_note}</p>
                      {report.declined_at && (
                        <p className="text-xs text-amber-500 mt-1">
                          {new Date(report.declined_at).toLocaleString()}
                        </p>
                      )}
                      <p className="text-xs text-amber-600 mt-2">
                        {t('admin_reports_declined_hint', 'Mpangie dereva mwingine hapa chini.')}
                      </p>
                    </div>
                  )}

                  {/* ===== DRIVER ISSUE ALERT ===== */}
                  {report.status === "issue_reported" && (
                    <div className="bg-red-50 border border-red-300 rounded-lg p-4 space-y-3">
                      <p className="font-semibold text-red-700">
                        ⚠️ {t('admin_reports_driver_issue_title', 'Dereva ameripoti changamoto')}
                      </p>
                      <p className="text-red-700 text-sm">
                        {report.driver_issue_note}
                      </p>
                      {report.issue_reported_at && (
                        <p className="text-xs text-red-500">
                          {new Date(report.issue_reported_at).toLocaleString()}
                        </p>
                      )}

                      <div>
                        <label className="block font-medium mb-2 text-sm">
                          {t('admin_reports_reassign_to', 'Mpangie dereva mwingine')}
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={reassignTarget[report.id] ?? ""}
                            onChange={(e) =>
                              setReassignTarget((prev) => ({ ...prev, [report.id]: e.target.value }))
                            }
                            className="flex-1 border rounded-lg p-3"
                          >
                            <option value="">{t('admin_reports_select_driver')}</option>
                            {drivers
                              .filter((d) => d.id !== report.assigned_to)
                              .map((driver) => (
                                <option key={driver.id} value={driver.id}>
                                  {driver.first_name} {driver.last_name}
                                </option>
                              ))}
                          </select>
                          <button
                            onClick={() => confirmAndReassign(report.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg whitespace-nowrap"
                          >
                            {t('admin_reports_confirm_reassign', 'Thibitisha na Mpangie')}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block font-medium mb-2">{t('admin_reports_change_status')}</label>
                    <select
                      value={report.status}
                      onChange={(e) => updateStatus(report.id, e.target.value)}
                      className="w-full border rounded-lg p-3"
                    >
                      <option value="pending">{t('status_pending')}</option>
                      <option value="assigned">{t('status_assigned', 'Amepangiwa (Inasubiri)')}</option>
                      <option value="in_progress">{t('status_in_progress')}</option>
                      <option value="issue_reported">{t('status_issue_reported', 'Changamoto')}</option>
                      <option value="resolved">{t('status_resolved')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium mb-2">{t('admin_reports_assign_driver')}</label>
                    <select
                      value={report.assigned_to ?? ""}
                      onChange={(e) => assignDriver(report.id, e.target.value)}
                      className="w-full border rounded-lg p-3"
                    >
                      <option value="">{t('admin_reports_select_driver')}</option>
                      {drivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.first_name} {driver.last_name}
                        </option>
                      ))}
                    </select>
                    {report.assigned_to && (
                      <p className="mt-2 text-green-600 text-sm">✅ {t('admin_reports_driver_assigned')}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}