import { useTranslation } from "react-i18next";
import { useLandingStats } from "../../hooks/useLandingStats";

function formatNumber(n: number) {
  return n.toLocaleString("en-US") + "+";
}

export default function Stats() {
  const { t } = useTranslation();
  const { stats, loading } = useLandingStats();

  const items = [
    { label: t("stat_registered_users"), value: stats?.registeredUsers ?? 0 },
    { label: t("stat_reports_resolved"), value: stats?.reportsResolved ?? 0 },
    { label: t("stat_active_drivers"), value: stats?.activeDrivers ?? 0 },
    { label: t("stat_municipalities"), value: stats?.municipalities ?? 0 },
  ];

  return (
    <section className="px-6 py-14">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
        {items.map((item, i) => (
          <div
            key={i}
            className="p-6 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-center"
          >
            <div className="text-3xl md:text-4xl font-extrabold text-white mb-1">
              {loading ? t("stat_loading") : formatNumber(item.value)}
            </div>
            <div className="text-sm text-white/60">{item.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}