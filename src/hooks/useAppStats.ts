import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export interface AppStats {
  citizens: number;
  drivers: number;
  vehicles: number;
  municipalities: number;
  reportsResolved: number;
  totalReports: number;
}

const emptyStats: AppStats = {
  citizens: 0,
  drivers: 0,
  vehicles: 0,
  municipalities: 0,
  reportsResolved: 0,
  totalReports: 0,
};

export function useAppStats() {
  const [stats, setStats] = useState<AppStats>(emptyStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        const [
          { count: citizens },
          { count: drivers },
          { count: vehicles },
          { count: municipalities },
          { count: reportsResolved },
          { count: totalReports },
        ] = await Promise.all([
          supabase
            .from("users")
            .select("*", { count: "exact", head: true })
            .eq("role", "citizen"),
          supabase
            .from("users")
            .select("*", { count: "exact", head: true })
            .eq("role", "driver"),
          supabase
            .from("vehicles")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("users")
            .select("*", { count: "exact", head: true })
            .eq("role", "municipality_admin"),
          supabase
            .from("waste_reports")
            .select("*", { count: "exact", head: true })
            .eq("status", "resolved"),
          supabase
            .from("waste_reports")
            .select("*", { count: "exact", head: true }),
        ]);

        if (!cancelled) {
          setStats({
            citizens: citizens ?? 0,
            drivers: drivers ?? 0,
            vehicles: vehicles ?? 0,
            municipalities: municipalities ?? 0,
            reportsResolved: reportsResolved ?? 0,
            totalReports: totalReports ?? 0,
          });
        }
      } catch (err) {
        console.error("Imeshindikana kupata app stats:", err);
        if (!cancelled) setStats(emptyStats);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStats();
    return () => {
      cancelled = true;
    };
  }, []);

  return { stats, loading };
}