import { useEffect, useState } from "react";
import { AlertTriangle, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { createActivity } from "../lib/activityService";
import { uploadReportPhoto } from "../lib/storageService";
import { Input } from "../components/common/Input";
import { Select } from "../components/common/Select";
import { Textarea } from "../components/common/Textarea";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  in_review: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function ReportIssue() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [reportType, setReportType] = useState("illegal_dumping");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");

  const [photo, setPhoto] = useState<File | null>(null);

  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);

  const [myReports, setMyReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  const loadMyReports = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from("waste_reports")
      .select("*")
      .eq("citizen_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error) setMyReports(data || []);
    setLoadingReports(false);
  };

  useEffect(() => {
    loadMyReports();

    if (!user?.id) return;
    const channel = supabase
      .channel(`my-reports-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "waste_reports",
          filter: `citizen_id=eq.${user.id}`,
        },
        () => loadMyReports()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert(t('report_geo_not_supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationLat(position.coords.latitude);
        setLocationLng(position.coords.longitude);

        alert(t('report_location_captured'));
      },
      (error) => {
        console.error("Geolocation error:", error.message);
        alert(t('report_location_failed'));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert(t('report_login_required'));
      return;
    }

    if (!description.trim() || !address.trim()) {
      alert(t('report_fill_required'));
      return;
    }

    setLoading(true);

    try {
      let photoUrl: string | null = null;

      if (photo) {
        photoUrl = await uploadReportPhoto(photo);
      }

      const { error } = await supabase
        .from("waste_reports")
        .insert({
          citizen_id: user.id,
          report_type: reportType,
          description: description.trim(),
          address: address.trim(),
          status: "pending",

          location_lat: locationLat,
          location_lng: locationLng,

          photos: photoUrl ? [photoUrl] : [],
        })
        .select()
        .single();

      if (error) throw error;

      await createActivity({
        type: "report",
        title: "Waste Report Submitted",
        description: `${reportType.replaceAll("_", " ")} - ${description}`,
        user_id: user.id,
        role: user.role ?? "citizen",
      });

      setReportType("illegal_dumping");
      setDescription("");
      setAddress("");
      setPhoto(null);
      setLocationLat(null);
      setLocationLng(null);

      loadMyReports();

      alert(t('report_success'));
    } catch (err: any) {
      console.error("Report submission failed:", err.message);
      alert(err.message || t('report_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <AlertTriangle className="text-red-500" size={28} />
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
          {t('report_title')}
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 rounded-xl shadow p-6 space-y-5"
      >
        <Select
          label={t('report_type_label')}
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          options={[
            { value: "illegal_dumping", label: t('report_type_illegal_dumping') },
            { value: "overflowing_bin", label: t('report_type_overflowing_bin') },
            { value: "missed_collection", label: t('report_type_missed_collection') },
            { value: "dirty_site", label: t('report_type_dirty_site') },
            { value: "other", label: t('report_type_other') },
          ]}
        />

        <Textarea
          label={t('report_description_label')}
          rows={5}
          placeholder={t('report_description_placeholder')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <Input
          label={t('report_address_label')}
          type="text"
          placeholder={t('report_address_placeholder')}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />

        <div>
          <button
            type="button"
            onClick={getCurrentLocation}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg"
          >
            📍 {t('report_get_location')}
          </button>

          {locationLat && locationLng && (
            <div className="mt-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3 text-secondary-900 dark:text-secondary-100">
              <p>
                <strong>{t('report_latitude')}:</strong> {locationLat}
              </p>
              <p>
                <strong>{t('report_longitude')}:</strong> {locationLng}
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block font-medium mb-2 text-secondary-700 dark:text-secondary-300">
            {t('report_upload_photo')}
          </label>

          <input
            type="file"
            accept="image/*"
            className="w-full border border-secondary-200 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-800 text-secondary-900 dark:text-secondary-100 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-primary-50 file:text-primary-700 dark:file:bg-slate-700 dark:file:text-secondary-100"
            onChange={(e) => {
              if (e.target.files?.length) {
                setPhoto(e.target.files[0]);
              }
            }}
          />

          {photo && (
            <div className="mt-4">
              <p className="text-green-600 dark:text-green-400 text-sm mb-3">
                {t('report_selected_photo')}: <strong>{photo.name}</strong>
              </p>

              <img
                src={URL.createObjectURL(photo)}
                alt="Preview"
                className="w-full h-64 object-cover rounded-lg border border-secondary-200 dark:border-slate-700"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg disabled:opacity-50"
        >
          {loading ? t('report_submitting') : t('report_submit_btn')}
        </button>
      </form>

      {/* RIPOTI ZANGU */}
      <div className="mt-10">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="text-secondary-400" size={20} />
          <h2 className="text-lg font-bold text-secondary-900 dark:text-white">
            {t('my_reports', 'Ripoti Zangu')}
          </h2>
        </div>

        {loadingReports && (
          <p className="text-sm text-secondary-400">{t('loading', 'Inapakia...')}</p>
        )}

        {!loadingReports && myReports.length === 0 && (
          <p className="text-sm text-secondary-400">
            {t('no_reports_yet', 'Bado hujatuma ripoti yoyote')}
          </p>
        )}

        <div className="space-y-3">
          {myReports.map((report) => (
            <div
              key={report.id}
              className="border border-secondary-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-800"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-secondary-900 dark:text-white capitalize">
                  {report.report_type.replaceAll("_", " ")}
                </h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                    STATUS_STYLES[report.status] || "bg-gray-100 text-gray-600"
                  }`}
                >
                  {report.status.replaceAll("_", " ")}
                </span>
              </div>

              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                {report.description}
              </p>

              <p className="text-xs text-secondary-400 mt-2">
                {report.address} · {new Date(report.created_at).toLocaleDateString()}
              </p>

              {report.resolution_notes && (
                <p className="text-xs mt-2 text-green-700 bg-green-50 rounded-lg p-2">
                  {report.resolution_notes}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}