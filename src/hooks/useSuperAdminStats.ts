import { useEffect, useState } from "react";
import { getPlatformStats, getDatabaseHealth } from "../services/superAdminService";
import type { PlatformStats } from "../types";

const emptyStats: PlatformStats = {
  totalCompanies: 0,
  totalCitizens: 0,
  totalDrivers: 0,
  totalAdmins: 0,
  totalRequests: 0,
  totalPayments: 0,
  totalRevenue: 0,
  pendingComplaints: 0,
  completedCollections: 0,
  activeVehicles: 0,
  onlineUsers: 0,
};

export function useSuperAdminStats() {
  const [stats, setStats] = useState<PlatformStats>(emptyStats);
  const [dbHealth, setDbHealth] = useState<{ status: string; latencyMs: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [statsData, healthData] = await Promise.all([
          getPlatformStats(),
          getDatabaseHealth(),
        ]);
        if (!cancelled) {
          setStats(statsData);
          setDbHealth(healthData);
        }
      } catch (err) {
        console.error("Imeshindikana kupata platform stats:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 60000); // sasisha kila dakika 1

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { stats, dbHealth, loading };
}