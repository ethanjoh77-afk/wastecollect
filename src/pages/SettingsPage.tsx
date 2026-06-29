import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useTranslation } from "react-i18next";

type Theme = "light" | "dark";
type Language = "en" | "sw";

export default function SettingsPage() {
  const { i18n } = useTranslation();

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
        setLanguage(data.language || "sw");
        setAccent(data.accent || "blue");
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
    i18n.changeLanguage(language);
  }, [language, i18n]);

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
      alert("Settings saved successfully");
    } else {
      console.error("Save error:", error);
      alert("Failed to save settings");
    }
  };

  // ================= LOADING UI =================
  if (loading) {
    return <div className="p-6">Loading settings...</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      <h1 className="text-2xl font-semibold">
        Settings
      </h1>

      {/* THEME */}
      <div className="p-5 border rounded-xl">
        <h2>Theme</h2>

        <button onClick={() => setTheme("light")}>Light</button>
        <button onClick={() => setTheme("dark")}>Dark</button>
      </div>

      {/* LANGUAGE */}
      <div className="p-5 border rounded-xl">
        <h2>Language</h2>

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
        <h2>Accent</h2>

        <select
          value={accent}
          onChange={(e) => setAccent(e.target.value)}
        >
          <option value="blue">Blue</option>
          <option value="green">Green</option>
          <option value="red">Red</option>
        </select>
      </div>

      {/* SAVE */}
      <button
        onClick={handleSave}
        className="w-full bg-green-600 text-white py-3 rounded"
      >
        Save Settings
      </button>

    </div>
  );
}