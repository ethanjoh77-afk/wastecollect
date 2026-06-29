import { useEffect, useState } from "react";
import { DashboardLayout } from "../components/layout";
import { supabase } from "../lib/supabase";

type Report = {
  id: string;
  report_type: string;
  description: string;
  address: string;
  status: string;
  created_at: string;
  assigned_to: string | null;
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  loadReports();
  loadDrivers();

  const channel = supabase
    .channel("admin-reports")
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
}, []);

  async function loadDrivers() {
    const { data } = await supabase
      .from("users")
      .select("id, first_name, last_name")
      .eq("role", "driver");

    if (data) {
     setDrivers(data);
    }
  }

  async function assignDriver(
    reportId: string,
    driverId: string
  ) {
    const { error } = await supabase
      .from("waste_reports")
      .update({
        assigned_to: driverId,
      })
      .eq("id", reportId);

    if (error) {
      alert(error.message);
      return;
    }

    loadReports();
  }

  async function loadReports() {
    setLoading(true);

    const { data, error } = await supabase
      .from("waste_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setReports(data);
    }

    setLoading(false);
  }

  async function updateStatus(
    id: string,
    status: string
  ) {
    const { error } = await supabase
      .from("waste_reports")
      .update({
        status,
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadReports();
  }

  function badgeColor(status: string) {
    switch (status) {
      case "resolved":
        return "bg-green-500";

      case "in_progress":
        return "bg-yellow-500";

      default:
        return "bg-red-500";
    }
  }

return (
  <DashboardLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Waste Reports
        </h1>

        <p className="text-gray-500">
          Manage citizen reports
        </p>
      </div>

      {loading ? (
        <p className="text-gray-500">
          Loading reports...
        </p>
      ) : (
        reports.map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="grid md:grid-cols-3 gap-6">

              {/* Photo */}

              <div>
                {report.photos && report.photos.length > 0 ? (
                  <img
                    src={report.photos[0]}
                    alt="Waste"
                    className="w-full h-56 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-full h-56 rounded-xl bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">
                      No Photo
                    </span>
                  </div>
                )}
              </div>

              {/* Report Details */}

              <div className="md:col-span-2 space-y-4">

                <div>
                  <h2 className="text-xl font-bold capitalize">
                    {report.report_type.replaceAll("_", " ")}
                  </h2>

                  <p className="mt-2">
                    {report.description}
                  </p>

                  <p className="text-gray-600 mt-2">
                    📍 {report.address}
                  </p>

                  <p className="text-sm text-gray-500">
                    {new Date(report.created_at).toLocaleString()}
                  </p>
                </div>

                {/* Status */}

                <div>
                  <span
                    className={`${badgeColor(report.status)} text-white px-4 py-2 rounded-full`}
                  >
                    {report.status.replaceAll("_", " ")}
                  </span>
                </div>

                {/* Change Status */}

                <div>
                  <label className="block font-medium mb-2">
                    Change Status
                  </label>

                  <select
                    value={report.status}
                    onChange={(e) =>
                      updateStatus(
                        report.id,
                        e.target.value
                      )
                    }
                    className="w-full border rounded-lg p-3"
                  >
                    <option value="pending">
                      Pending
                    </option>

                    <option value="in_progress">
                      In Progress
                    </option>

                    <option value="resolved">
                      Resolved
                    </option>
                  </select>
                </div>

                {/* Assign Driver */}

                <div>
                  <label className="block font-medium mb-2">
                    Assign Driver
                  </label>

                  <select
                    value={report.assigned_to ?? ""}
                    onChange={(e) =>
                      assignDriver(
                        report.id,
                        e.target.value
                      )
                    }
                    className="w-full border rounded-lg p-3"
                  >
                    <option value="">
                      -- Select Driver --
                    </option>

                    {drivers.map((driver) => (
                      <option
                        key={driver.id}
                        value={driver.id}
                      >
                        {driver.first_name} {driver.last_name}
                      </option>
                    ))}
                  </select>

                  {report.assigned_to && (
                    <p className="mt-2 text-green-600 text-sm">
                      ✅ Driver Assigned
                    </p>
                  )}
                </div>

              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </DashboardLayout>
)