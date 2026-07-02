import { useEffect, useState } from "react";
import { DashboardLayout } from "../components/layout";
import { supabase } from "../lib/supabase";
import { useTranslation } from "react-i18next";

type Hotspot = {
  area: string;
  risk: "high" | "medium" | "low";
  score: number;
  reason: string;
  recommendation: string;
  trend: "increasing" | "stable" | "decreasing";
};

type ReportSummary = {
  area: string;
  type: string;
  status: string;
  count: number;
  days_unresolved: number;
};

export default function HotspotPredictionPage() {
  const { t, i18n } = useTranslation();
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalReports, setTotalReports] = useState(0);
  const [pendingReports, setPendingReports] = useState(0);
  const [lastAnalyzed, setLastAnalyzed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const { data } = await supabase
      .from("waste_reports")
      .select("status");

    if (data) {
      setTotalReports(data.length);
      setPendingReports(data.filter((r) => r.status === "pending").length);
    }
  }

  async function analyze() {
    setLoading(true);
    setError(null);
    setHotspots([]);

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: reports, error: dbError } = await supabase
        .from("waste_reports")
        .select("address, report_type, status, created_at")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false });

      if (dbError) throw new Error(dbError.message);
      if (!reports || reports.length === 0) {
        setError(t('hotspot_not_enough_data'));
        setLoading(false);
        return;
      }

      const areaSummary: Record<string, ReportSummary> = {};
      reports.forEach((r) => {
        const area = r.address?.split(",")[0]?.trim() || "Unknown";
        if (!areaSummary[area]) {
          areaSummary[area] = {
            area,
            type: r.report_type,
            status: r.status,
            count: 0,
            days_unresolved: 0,
          };
        }
        areaSummary[area].count += 1;
        if (r.status === "pending") {
          const days = Math.floor(
            (Date.now() - new Date(r.created_at).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          areaSummary[area].days_unresolved = Math.max(
            areaSummary[area].days_unresolved,
            days
          );
        }
      });

      const summaryData = Object.values(areaSummary).slice(0, 15);

      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error("VITE_ANTHROPIC_API_KEY haipo kwenye .env");

      const responseLanguage = i18n.language === "sw" ? "Swahili" : "English";

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `You are an AI analyst for WasteCollect, a digital waste management system in Dar es Salaam, Tanzania.

Analyze this waste report data and identify the top hotspot areas that need urgent attention. Respond ONLY with a valid JSON array, no markdown, no backticks, no explanation. Write the "reason" and "recommendation" fields in ${responseLanguage}.

Data: ${JSON.stringify(summaryData)}

Return exactly this JSON structure (max 5 areas, sorted by score descending):
[
  {
    "area": "area name from data",
    "risk": "high|medium|low",
    "score": 85,
    "reason": "One sentence explaining why this area is a hotspot, written in ${responseLanguage}",
    "recommendation": "One specific actionable recommendation for the collection team, written in ${responseLanguage}",
    "trend": "increasing|stable|decreasing"
  }
]`,
            },
          ],
        }),
      });

      const aiData = await response.json();

      if (!response.ok || aiData.error) {
        throw new Error(
          aiData.error?.message ||
            `API Error: ${response.status} ${response.statusText}`
        );
      }

      if (!aiData.content || !aiData.content[0]) {
        throw new Error(
          `Jibu lisilo sahihi kutoka AI: ${JSON.stringify(aiData)}`
        );
      }

      const text = aiData.content[0].text
        .trim()
        .replace(/```json|```/g, "")
        .trim();

      const result: Hotspot[] = JSON.parse(text);

      setHotspots(result);
      setLastAnalyzed(new Date().toLocaleTimeString());
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : t('hotspot_unknown_error')
      );
    } finally {
      setLoading(false);
    }
  }

  function riskBadge(risk: string) {
    switch (risk) {
      case "high":
        return "bg-red-100 text-red-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-green-100 text-green-700";
    }
  }

  function barColor(risk: string) {
    switch (risk) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      default:
        return "bg-green-500";
    }
  }

  function trendIcon(trend: string) {
    switch (trend) {
      case "increasing":
        return "📈";
      case "decreasing":
        return "📉";
      default:
        return "➡️";
    }
  }

  function riskLabel(risk: string) {
    switch (risk) {
      case "high": return t('hotspot_risk_high');
      case "medium": return t('hotspot_risk_medium');
      default: return t('hotspot_risk_low');
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">🧠 {t('hotspot_title')}</h1>
          <p className="text-gray-500 mt-1">
            {t('hotspot_subtitle')}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow p-4">
            <p className="text-sm text-gray-500">{t('hotspot_stat_total_reports')}</p>
            <p className="text-2xl font-bold">{totalReports}</p>
            <p className="text-xs text-gray-400">{t('hotspot_stat_this_month')}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <p className="text-sm text-gray-500">{t('hotspot_stat_risky_areas')}</p>
            <p className="text-2xl font-bold text-red-600">
              {hotspots.filter((h) => h.risk === "high").length || "—"}
            </p>
            <p className="text-xs text-gray-400">{t('hotspot_stat_needs_urgent')}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <p className="text-sm text-gray-500">{t('hotspot_stat_pending')}</p>
            <p className="text-2xl font-bold text-yellow-600">
              {pendingReports}
            </p>
            <p className="text-xs text-gray-400">{t('hotspot_stat_unresolved')}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <p className="text-sm text-gray-500">{t('hotspot_stat_last_analysis')}</p>
            <p className="text-lg font-bold text-green-600">
              {lastAnalyzed || "—"}
            </p>
            <p className="text-xs text-gray-400">{t('hotspot_stat_today')}</p>
          </div>
        </div>

        {/* Analyze Button */}
        <button
          onClick={analyze}
          disabled={loading}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl transition-colors text-lg"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              {t('hotspot_analyzing')}
            </span>
          ) : (
            `✨ ${t('hotspot_analyze_btn')}`
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            ⚠️ {error}
          </div>
        )}

        {/* Results */}
        {hotspots.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700">
              📍 {t('hotspot_results_title')}
            </h2>
            {hotspots.map((h, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-lg p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">📍 {h.area}</h3>
                  <div className="flex items-center gap-2">
                    <span>{trendIcon(h.trend)}</span>
                    <span
                      className={`text-sm font-semibold px-3 py-1 rounded-full ${riskBadge(h.risk)}`}
                    >
                      {riskLabel(h.risk)}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm text-gray-500 mb-1">
                    <span>{t('hotspot_risk_score')}</span>
                    <span className="font-semibold">{h.score}/100</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor(h.risk)}`}
                      style={{ width: `${h.score}%` }}
                    />
                  </div>
                </div>

                <p className="text-gray-600">{h.reason}</p>

                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4">
                  <p className="text-sm font-semibold text-blue-800 mb-1">
                    {t('hotspot_recommendation_label')}
                  </p>
                  <p className="text-sm text-blue-700">{h.recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && hotspots.length === 0 && !error && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-4">🧠</p>
            <p className="text-lg font-medium">{t('hotspot_empty_title')}</p>
            <p className="text-sm">
              {t('hotspot_empty_subtitle')}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}