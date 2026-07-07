import { useEffect, useRef, useState } from "react";
import { updateTruckLocation } from "../lib/truckTrackingService";
import { debounce } from "../lib/debounce";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Users,
  Truck,
  MapPin,
  DollarSign,
  FileText,
  Recycle,
  AlertTriangle,
  TrendingUp,
  Calendar,
} from "lucide-react";

import { DashboardLayout } from "../components/layout";
import {
  StatCard,
  QuickAction,
  AreaChartCard,
  ActivityFeed,
} from "../components/dashboard";

import { useAuth } from "../hooks/useAuth";

// ================= MAIN PAGE =================
export default function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {role === "super_admin" && <SuperAdminDashboard />}
        {role === "municipality_admin" && <MunicipalityDashboard />}
        {role === "company_admin" && <CompanyDashboard />}
        {role === "driver" && <DriverDashboard />}
        {(!role || role === "citizen") && <CitizenDashboard />}
      </div>
    </DashboardLayout>
  );
}

// ================= SUPER ADMIN =================
function SuperAdminDashboard() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('super_admin_dashboard')}</h1>

      <QuickAction
        title={t('track_truck')}
        icon={MapPin}
        color="bg-secondary-500"
      />

      <AreaChartCard title={t('waste_collection_trend')} data={[]} />

      <ActivityFeed />
    </div>
  );
}

// ================= MUNICIPALITY =================
function MunicipalityDashboard() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('municipality_dashboard')}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('wards')} value="—" icon={MapPin} iconColor="bg-primary-500" />
        <StatCard title={t('reports')} value="—" icon={FileText} iconColor="bg-warning-500" />
        <StatCard title={t('collections')} value="—" icon={Truck} iconColor="bg-success-500" />
        <StatCard title={t('drivers')} value="—" icon={Users} iconColor="bg-secondary-500" />
      </div>

      <ActivityFeed />
    </div>
  );
}

// ================= COMPANY =================
function CompanyDashboard() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('company_dashboard')}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('drivers')} value="—" icon={Users} iconColor="bg-primary-500" />
        <StatCard title={t('vehicles')} value="—" icon={Truck} iconColor="bg-secondary-500" />
        <StatCard title={t('routes')} value="—" icon={MapPin} iconColor="bg-success-500" />
        <StatCard title={t('tasks')} value="—" icon={FileText} iconColor="bg-accent-500" />
      </div>

      <ActivityFeed />
    </div>
  );
}

// ================= DRIVER =================
function DriverDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const debouncedLoadReports = useRef(debounce(loadReports, 1000)).current;

  // ================= LOAD REPORTS + REALTIME =================
  useEffect(() => {
    if (!user) return;

    loadReports();

    const channel = supabase
      .channel("driver-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "waste_reports",
        },
        () => {
          debouncedLoadReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // ================= LIVE GPS =================
  useEffect(() => {
    if (!user) return;

    if (!navigator.geolocation) {
      console.log("Geolocation is not supported.");
      return;
    }

    const sendLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          await updateTruckLocation(
            user.id,
            position.coords.latitude,
            position.coords.longitude
          );
        },
        (error) => {
          console.error("GPS Error:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    };

    sendLocation();
    const interval = setInterval(sendLocation, 15000);

    return () => clearInterval(interval);
  }, [user]);

  // ================= LOAD ASSIGNED REPORTS =================
  async function loadReports() {
    if (!user) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("waste_reports")
      .select("*")
      .eq("assigned_to", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setReports(data ?? []);
    }

    setLoading(false);
  }

  // ================= UPDATE REPORT STATUS =================
  async function updateReportStatus(reportId: string, status: string) {
    const { error } = await supabase
      .from("waste_reports")
      .update({ status })
      .eq("id", reportId);

    if (error) {
      alert(error.message);
      return;
    }

    loadReports();
  }

  // ================= REPORT DRIVER ISSUE (Ripoti Changamoto) =================
  async function reportDriverIssue(reportId: string) {
    const note = window.prompt(
      t(
        'report_challenge_prompt',
        'Eleza changamoto uliyonayo (mfano: mzigo mkubwa, muda mrefu wa ukusanyaji):'
      )
    );

    if (!note || !note.trim()) return;

    const { error } = await supabase.rpc('report_driver_issue', {
      p_report_id: reportId,
      p_note: note.trim(),
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert(t('report_challenge_sent', 'Umetuma taarifa ya changamoto kwa admin.'));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('driver_dashboard')}</h1>
        <p className="text-gray-500">{t('assigned_waste_jobs')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title={t('assigned_jobs')}
          value={reports.length}
          icon={Truck}
          iconColor="bg-blue-500"
        />

        <StatCard
          title={t('completed')}
          value={reports.filter((r) => r.status === "resolved").length}
          icon={FileText}
          iconColor="bg-green-500"
        />

        <StatCard
          title={t('remaining')}
          value={reports.filter((r) => r.status !== "resolved").length}
          icon={MapPin}
          iconColor="bg-orange-500"
        />
      </div>

      {loading && (
        <div className="bg-white rounded-xl p-6 shadow">
          {t('loading_assigned_reports')}
        </div>
      )}

      {!loading && reports.length === 0 && (
        <div className="bg-white rounded-xl p-10 shadow text-center text-gray-500">
          {t('no_reports_assigned')}
        </div>
      )}

      {!loading &&
        reports.map((report) => (
          <div key={report.id} className="bg-white rounded-xl shadow-lg p-5">
            <div className="grid md:grid-cols-3 gap-5">
              <div>
                {report.photos && report.photos.length > 0 ? (
                  <img
                    src={report.photos[0]}
                    alt="Waste"
                    className="rounded-xl h-52 w-full object-cover"
                  />
                ) : (
                  <div className="bg-gray-200 rounded-xl h-52 flex items-center justify-center">
                    {t('no_photo')}
                  </div>
                )}
              </div>

              <div className="md:col-span-2 space-y-3">
                <h2 className="text-xl font-bold capitalize">
                  {report.report_type.replaceAll("_", " ")}
                </h2>

                <p>{report.description}</p>

                <p>📍 {report.address}</p>

                <p>
                  {t('status_label')}:
                  <strong> {report.status.replaceAll("_", " ")}</strong>
                </p>

                <div className="flex gap-3 pt-4">
                  {report.status === "pending" && (
                    <button
                      onClick={() => updateReportStatus(report.id, "in_progress")}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-lg"
                    >
                      {t('start_collection')}
                    </button>
                  )}

                  {report.status === "in_progress" && (
                    <button
                      onClick={() => updateReportStatus(report.id, "resolved")}
                      className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg"
                    >
                      {t('complete_job')}
                    </button>
                  )}

                  {report.status === "resolved" && (
                    <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg">
                      ✓ {t('completed')}
                    </span>
                  )}

                  {report.status !== "resolved" && (
                    <button
                      onClick={() => reportDriverIssue(report.id)}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg"
                    >
                      ⚠️ {t('report_challenge', 'Ripoti Changamoto')}
                    </button>
                  )}
                </div>

                <p className="text-sm text-gray-500">
                  {new Date(report.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}

// ================= CITIZEN =================
function CitizenDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('welcome_back')}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('eco_score')} value="—" icon={Recycle} iconColor="bg-success-500" />
        <StatCard title={t('points')} value="—" icon={TrendingUp} iconColor="bg-primary-500" />
        <StatCard title={t('next_collection')} value="—" icon={Calendar} iconColor="bg-secondary-500" />
        <StatCard title={t('reports')} value="—" icon={FileText} iconColor="bg-warning-500" />
      </div>

      <ActivityFeed />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickAction
          title={t('report_issue')}
          description={t('report_issue_desc')}
          icon={AlertTriangle}
          color="bg-warning-500"
          onClick={() => navigate("/report-issue")}
        />

        <QuickAction
          title={t('request_pickup')}
          description={t('request_pickup_desc')}
          icon={Truck}
          color="bg-primary-500"
          onClick={() => navigate("/pickup-request")}
        />

        <QuickAction
          title={t('track_truck')}
          description={t('track_truck_desc')}
          icon={MapPin}
          color="bg-secondary-500"
          onClick={() => navigate("/track-truck")}
        />

        <QuickAction
          title={t('pay_fees')}
          description={t('pay_fees_desc')}
          icon={DollarSign}
          color="bg-success-500"
          onClick={() => navigate("/payments")}
        />
      </div>
    </div>
  );
}