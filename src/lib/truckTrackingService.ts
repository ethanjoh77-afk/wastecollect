import { supabase } from "./supabase";

export async function updateTruckLocation(
  driverId: string,
  latitude: number,
  longitude: number
) {
  const { error } = await supabase
    .from("truck_locations")
    .upsert(
      {
        driver_id: driverId,
        latitude,
        longitude,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "driver_id",
      }
    );

  if (error) {
    console.error("Truck location update failed:", error);
  }
}