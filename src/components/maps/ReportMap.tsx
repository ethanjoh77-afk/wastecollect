import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { supabase } from "../../lib/supabase";
import { getStatusIcon } from "./mapIcons";

type Report = {
  id: string;
  report_type: string;
  description: string;
  address: string;
  status: string;
  location_lat: number;
  location_lng: number;
  photos: string[] | null;
  created_at: string;
};

export default function ReportMap() {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    const { data, error } = await supabase
      .from("waste_reports")
      .select("*")
      .not("location_lat", "is", null)
      .not("location_lng", "is", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed loading reports:", error);
      return;
    }

    setReports(data ?? []);
  }

  useEffect(() => {
  const channel = supabase
    .channel("live-waste-reports")

    // Report mpya
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "waste_reports",
      },
      (payload) => {
        const report = payload.new as Report;

        if (
          report.location_lat !== null &&
          report.location_lng !== null
        ) {
          setReports((prev) => [report, ...prev]);
        }
      }
    )

    // Report imebadilishwa
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "waste_reports",
      },
      (payload) => {
        const updated = payload.new as Report;

        setReports((prev) =>
          prev.map((r) =>
            r.id === updated.id ? updated : r
          )
        );
      }
    )

    // Report imefutwa
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "waste_reports",
      },
      (payload) => {
        const deleted = payload.old as Report;

        setReports((prev) =>
          prev.filter((r) => r.id !== deleted.id)
        );
      }
    )

    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

  return (
    <MapContainer
      center={[-6.7924, 39.2083]}
      zoom={12}
      style={{
        height: "600px",
        width: "100%",
        borderRadius: "12px",
      }}
    >
      <TileLayer
        attribution="© OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {reports.map((report) => (
        <Marker
          key={report.id}
          position={[report.location_lat, report.location_lng]}
          icon={getStatusIcon(report.status)}
        >
          <Popup>
            <div className="space-y-2 min-w-[220px]">
              <h3 className="font-bold text-lg capitalize">
                {report.report_type.replaceAll("_", " ")}
              </h3>

              <p>{report.description}</p>

              <p>📍 {report.address}</p>

              <p>
                <strong>Status:</strong> {report.status}
              </p>

              <p className="text-xs text-gray-500">
                {new Date(report.created_at).toLocaleString()}
              </p>

              {report.photos && report.photos.length > 0 && (
                <img
                  src={report.photos[0]}
                  alt="Waste"
                  className="w-full rounded-lg border"
                />
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}