import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Truck, Clock, User } from "lucide-react";

type VehicleWithDriver = {
  id: string;
  registration_number: string;
  current_latitude: number | null;
  current_longitude: number | null;
  last_location_update: string | null;
  driver_id: string | null;
  users: {
    first_name: string;
    last_name: string;
  } | null;
};

export default function TrackTruckPage() {
  const [vehicles, setVehicles] = useState<VehicleWithDriver[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadVehicles() {
    setLoading(true);
    const { data, error } = await supabase
      .from("vehicles")
      .select(`
        id,
        registration_number,
        current_latitude,
        current_longitude,
        last_location_update,
        driver_id,
        users (
          first_name,
          last_name
        )
      `);

    if (error) {
      console.error("Imeshindikana kupata magari:", error);
      setVehicles([]);
    } else {
      setVehicles(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadVehicles();

    const channel = supabase
      .channel("track-truck-page")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vehicles" },
        () => loadVehicles()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function hasLiveLocation(v: VehicleWithDriver) {
    return v.current_latitude != null && v.current_longitude != null;
  }

  if (loading) {
    return <div className="p-6 text-center">Inapakia magari...</div>;
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <h1 className="text-xl font-bold mb-4">Fuatilia Gari (Track Truck)</h1>

      {vehicles.length === 0 && (
        <p className="text-gray-500">Hakuna gari lililosajiliwa kwa sasa.</p>
      )}

      {vehicles.map((v) => (
        <div
          key={v.id}
          className="border rounded-xl p-4 shadow-sm flex flex-col gap-2"
        >
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-green-600" />
            <span className="font-semibold">{v.registration_number}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            {v.users
              ? `${v.users.first_name} ${v.users.last_name}`
              : "Dereva hajapangwa"}
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-4 h-4" />
            {v.last_location_update
              ? new Date(v.last_location_update).toLocaleString()
              : "Hakuna taarifa ya mahali bado"}
          </div>

          {hasLiveLocation(v) ? (
            <span className="text-xs text-green-600 font-medium">
              🟢 Iko hewani (live)
            </span>
          ) : (
            <span className="text-xs text-gray-400 font-medium">
              ⚪ Haipatikani mahali sasa hivi
            </span>
          )}
        </div>
      ))}
    </div>
  );
}