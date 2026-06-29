import { updateTruckLocation } from "../lib/truckTrackingService";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
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

import { Card, CardHeader, CardTitle, CardContent } from "../components/common";
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
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>

      <QuickAction
        title="Track Truck"
        icon={MapPin}
        color="bg-secondary-500"
      />

      <AreaChartCard title="Waste Collection Trend" data={[]} />

      <ActivityFeed />
    </div>
  );
}

// ================= MUNICIPALITY =================
function MunicipalityDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Municipality Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Wards" value="—" icon={MapPin} iconColor="bg-primary-500" />
        <StatCard title="Reports" value="—" icon={FileText} iconColor="bg-warning-500" />
        <StatCard title="Collections" value="—" icon={Truck} iconColor="bg-success-500" />
        <StatCard title="Drivers" value="—" icon={Users} iconColor="bg-secondary-500" />
      </div>

      <ActivityFeed />
    </div>
  );
}

// ================= COMPANY =================
function CompanyDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Company Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Drivers" value="—" icon={Users} iconColor="bg-primary-500" />
        <StatCard title="Vehicles" value="—" icon={Truck} iconColor="bg-secondary-500" />
        <StatCard title="Routes" value="—" icon={MapPin} iconColor="bg-success-500" />
        <StatCard title="Tasks" value="—" icon={FileText} iconColor="bg-accent-500" />
      </div>

      <ActivityFeed />
    </div>
  );
}

// ================= DRIVER =================
function DriverDashboard() {
  const { user } = useAuth();

  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
          loadReports();
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

    // Send immediately
    sendLocation();

    // Send every 5 seconds
    const interval = setInterval(sendLocation, 5000);

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
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(error);
  } else {
    setReports(data ?? []);
  }

  setLoading(false);
}

// ================= UPDATE REPORT STATUS =================
async function updateReportStatus(
  reportId: string,
  status: string
) {
  const { error } = await supabase
    .from("waste_reports")
    .update({
      status,
    })
    .eq("id", reportId);

  if (error) {
    alert(error.message);
    return;
  }

  loadReports();
}

return (
  <div className="space-y-6">

    <div>
      <h1 className="text-3xl font-bold">
        Driver Dashboard
      </h1>

      <p className="text-gray-500">
        Assigned Waste Collection Jobs
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      <StatCard
        title="Assigned Jobs"
        value={reports.length}
        icon={Truck}
        iconColor="bg-blue-500"
      />

      <StatCard
        title="Completed"
        value={
          reports.filter(
            (r) => r.status === "resolved"
          ).length
        }
        icon={FileText}
        iconColor="bg-green-500"
      />

      <StatCard
        title="Remaining"
        value={
          reports.filter(
            (r) => r.status !== "resolved"
          ).length
        }
        icon={MapPin}
        iconColor="bg-orange-500"
      />

    </div>

    {loading && (
      <div className="bg-white rounded-xl p-6 shadow">
        Loading assigned reports...
      </div>
    )}

      {!loading && reports.length === 0 && (
        <div className="bg-white rounded-xl p-10 shadow text-center text-gray-500">
          No reports assigned to you.
        </div>
      )}

      {!loading &&
        reports.map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-xl shadow-lg p-5"
          >

            <div className="grid md:grid-cols-3 gap-5">

              <div>

                {report.photos &&
                report.photos.length > 0 ? (
                  <img
                    src={report.photos[0]}
                    alt="Waste"
                    className="rounded-xl h-52 w-full object-cover"
                  />
                ) : (
                  <div className="bg-gray-200 rounded-xl h-52 flex items-center justify-center">
                    No Photo
                  </div>
                )}

              </div>

              <div className="md:col-span-2 space-y-3">

                <h2 className="text-xl font-bold capitalize">
                  {report.report_type.replaceAll("_", " ")}
                </h2>

                <p>{report.description}</p>

                <p>
                  📍 {report.address}
                </p>

                <p>
                  Status:
                  <strong>
                    {" "}
                    {report.status.replaceAll("_", " ")}
                  </strong>
                </p>
                  
              <div className="flex gap-3 pt-4">

  {report.status === "pending" && (
    <button
      onClick={() =>
        updateReportStatus(
          report.id,
          "in_progress"
        )
      }
      className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-lg"
    >
      Start Collection
    </button>
  )}

  {report.status === "in_progress" && (
    <button
      onClick={() =>
        updateReportStatus(
          report.id,
          "resolved"
        )
      }
      className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg"
    >
      Complete Job
    </button>
  )}

  {report.status === "resolved" && (
    <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg">
      ✓ Completed
    </span>
  )}

</div> 

                <p className="text-sm text-gray-500">
                  {new Date(
                    report.created_at
                  ).toLocaleString()}
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Welcome back</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Eco Score"
          value="—"
          icon={Recycle}
          iconColor="bg-success-500"
        />

        <StatCard
          title="Points"
          value="—"
          icon={TrendingUp}
          iconColor="bg-primary-500"
        />

        <StatCard
          title="Next Collection"
          value="—"
          icon={Calendar}
          iconColor="bg-secondary-500"
        />

        <StatCard
          title="Reports"
          value="—"
          icon={FileText}
          iconColor="bg-warning-500"
        />
      </div>

      <ActivityFeed />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickAction
          title="Report Issue"
          description="Submit waste complaints"
          icon={AlertTriangle}
          color="bg-warning-500"
          onClick={() => navigate("/report-issue")}
        />

        <QuickAction
          title="Request Pickup"
          description="Request waste pickup"
          icon={Truck}
          color="bg-primary-500"
          onClick={() => navigate("/pickup-request")}
        />

       <QuickAction
         title="Track Truck"
         description="Track collection vehicle"
         icon={MapPin}
         color="bg-secondary-500"
         onClick={() => navigate("/track-truck")}
       />

       <QuickAction
         title="Pay Fees"
         description="Pay waste collection fees"
         icon={DollarSign}
         color="bg-success-500"
         onClick={() => navigate("/payment")}
       />
        
      </div>
    </div>
  );
}