import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export interface LandingStats {
  registeredUsers: number;
  reportsResolved: number;
  activeDrivers: number;
  municipalities: number;
}

export function useLandingStats() {
  const [stats, setStats] = useState<LandingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        const [
          { count: registeredUsers },
          { count: reportsResolved },
          { count: activeDrivers },
          { count: municipalities },
        ] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase
            .from("reports")
            .select("*", { count: "exact", head: true })
            .eq("status", "resolved"),
          supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("role", "driver"),
          supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("role", "municipality"),
        ]);

        if (!cancelled) {
          setStats({
            registeredUsers: registeredUsers ?? 0,
            reportsResolved: reportsResolved ?? 0,
            activeDrivers: activeDrivers ?? 0,
            municipalities: municipalities ?? 0,
          });
        }
      } catch (err) {
        console.error("Imeshindikana kupata stats:", err);
        if (!cancelled) {
          setStats({
            registeredUsers: 0,
            reportsResolved: 0,
            activeDrivers: 0,
            municipalities: 0,
          });
        }
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