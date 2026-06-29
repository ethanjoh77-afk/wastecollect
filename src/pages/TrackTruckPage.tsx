import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Truck = {
  id: string;
  name: string;
  plate_number: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  updated_at: string;
};

export default function TrackTruckPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrucks = async () => {
    const { data, error } = await supabase
      .from("trucks")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setTrucks(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTrucks();

    // 🔴 REALTIME LISTENER (Supabase)
    const channel = supabase
      .channel("trucks-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trucks",
        },
        () => {
          fetchTrucks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return <div className="p-6">Loading trucks...</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Live Truck Tracking</h1>

      {trucks.length === 0 && (
        <p className="text-gray-500">No trucks available</p>
      )}

      <div className="grid gap-4">
        {trucks.map((truck) => (
          <div
            key={truck.id}
            className="border rounded-xl p-4 shadow bg-white"
          >
            <h2 className="font-bold text-lg">{truck.name}</h2>

            <p>Plate: {truck.plate_number}</p>

            <p>
              Status:{" "}
              <span
                className={
                  truck.status === "active"
                    ? "text-green-600"
                    : "text-gray-500"
                }
              >
                {truck.status}
              </span>
            </p>

            <p>
              Location:{" "}
              {truck.latitude && truck.longitude
                ? `${truck.latitude}, ${truck.longitude}`
                : "Not available"}
            </p>

            <p className="text-sm text-gray-400">
              Updated: {new Date(truck.updated_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}