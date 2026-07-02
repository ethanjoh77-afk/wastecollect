import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useTranslation } from "react-i18next";

type Theme = "light" | "dark";
type Language = "en" | "sw";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();

  const [loading, setLoading] = useState(true);

  const [theme, setTheme] = useState<Theme>("light");
  const [language, setLanguage] = useState<Language>("sw");
  const [accent, setAccent] = useState("blue");

  const [userId, setUserId] = useState<string | null>(null);

  // ================= GET LOGGED USER =================
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id || null);
    };

    getUser();
  }, []);

  // ================= LOAD SETTINGS FROM DB =================
  useEffect(() => {
    if (!userId) return;

    const loadSettings = async () => {
      setLoading(true);

      const { data } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (data) {
        setTheme(data.theme || "light");
        setLanguage(data.language || (i18n.language as Language) || "sw");
        setAccent(data.accent || "blue");
      } else {
        // Hakuna settings zilizohifadhiwa bado — tumia lugha ya sasa ya i18n
        // (iliyowekwa na LanguageSwitcher/localStorage), si kuandika juu yake.
        setLanguage((i18n.language as Language) || "sw");
      }

      setLoading(false);
    };

    loadSettings();
  }, [userId]);

  // ================= APPLY THEME =================
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // ================= APPLY LANGUAGE =================
  useEffect(() => {
    if (!loading) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n, loading]);

  // ================= SAVE TO DATABASE =================
  const handleSave = async () => {
    if (!userId) return;

    const { error } = await supabase
      .from("user_settings")
      .upsert(
        {
          user_id: userId,
          theme,
          language,
          accent,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

    if (!error) {
      alert(t('settings_saved'));
    } else {
      console.error("Settings save failed:", error.message);
      alert(t('settings_save_failed'));
    }
  };

  // ================= LOADING UI =================
  if (loading) {
    return <div className="p-6">{t('settings_loading')}</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      <h1 className="text-2xl font-semibold">
        {t('settings_title')}
      </h1>

      {/* THEME */}
      <div className="p-5 border rounded-xl">
        <h2>{t('settings_theme')}</h2>

        <button onClick={() => setTheme("light")}>{t('settings_theme_light')}</button>
        <button onClick={() => setTheme("dark")}>{t('settings_theme_dark')}</button>
      </div>

      {/* LANGUAGE */}
      <div className="p-5 border rounded-xl">
        <h2>{t('settings_language')}</h2>

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
        >
          <option value="sw">Kiswahili</option>
          <option value="en">English</option>
        </select>
      </div>

      {/* ACCENT */}
      <div className="p-5 border rounded-xl">
        <h2>{t('settings_accent')}</h2>

        <select
          value={accent}
          onChange={(e) => setAccent(e.target.value)}
        >
          <option value="blue">{t('settings_accent_blue')}</option>
          <option value="green">{t('settings_accent_green')}</option>
          <option value="red">{t('settings_accent_red')}</option>
        </select>
      </div>

      {/* SAVE */}
      <button
        onClick={handleSave}
        className="w-full bg-green-600 text-white py-3 rounded"
      >
        {t('settings_save_btn')}
      </button>

    </div>
  );
}