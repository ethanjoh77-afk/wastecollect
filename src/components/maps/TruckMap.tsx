import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { supabase } from "../../lib/supabase";
import { truckIcon } from "./truckIcon";
import { debounce } from "../../lib/debounce";

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type TruckLocation = {
  driver_id: string;
  latitude: number;
  longitude: number;
  updated_at: string;

  users: {
    first_name: string;
    last_name: string;
  } | null;
};

export default function TruckMap() {
  const [trucks, setTrucks] = useState<TruckLocation[]>([]);

  async function loadLocations() {
    const { data, error } = await supabase
      .from("truck_locations")
      .select(`
        *,
        users (
          first_name,
          last_name
        )
      `);

    if (error) {
      console.error(error);
      return;
    }

    setTrucks(data ?? []);
  }

  // debounce inaundwa mara moja tu, si kwenye kila render
  const debouncedLoad = useRef(debounce(loadLocations, 1000)).current;

  useEffect(() => {
    loadLocations();

    const channel = supabase
      .channel("truck-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "truck_locations",
        },
        () => {
          debouncedLoad();
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
        attribution="© OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {trucks.map((truck) => (
        <Marker
          key={truck.driver_id}
          position={[truck.latitude, truck.longitude]}
          icon={truckIcon}
        >
          <Popup>
            <h3 className="font-bold text-lg">
              {truck.users
                ? `${truck.users.first_name} ${truck.users.last_name}`
                : "Unknown Driver"}
            </h3>

            <p className="mt-2">
              <strong>Driver ID</strong>
              <br />
              {truck.driver_id}
            </p>

            <p className="text-xs text-gray-500 mt-2">
              Last Update
              <br />
              {new Date(truck.updated_at).toLocaleString()}
            </p>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}