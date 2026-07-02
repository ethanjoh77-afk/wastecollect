import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { User, Mail, Shield, Save } from "lucide-react";
import { useTranslation } from "react-i18next";

type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  created_at: string;
};

export default function ProfilePage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // ================= FETCH =================
  const fetchProfile = async () => {
    if (!user) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Profile fetch failed:", error.message);
      setLoading(false);
      return;
    }

    setProfile(data);
    setFirstName(data?.first_name || "");
    setLastName(data?.last_name || "");
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  // ================= UPDATE =================
  const updateProfile = async () => {
    if (!user) return;

    setSaving(true);

    const { error } = await supabase
      .from("users")
      .update({ first_name: firstName, last_name: lastName })
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      alert(t('profile_update_failed'));
      return;
    }

    alert(t('profile_updated'));
    fetchProfile();
  };

  if (loading) {
    return (
      <div className="p-6 text-gray-500">
        {t('profile_loading')}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-2xl shadow">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User /> {t('profile_title')}
        </h1>
        <p className="text-sm opacity-80">
          {t('profile_subtitle')}
        </p>
      </div>

      {/* PROFILE CARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* FIRST NAME */}
        <div className="bg-white p-5 rounded-xl shadow border">
          <label className="text-sm text-gray-500 flex items-center gap-2">
            <User size={16} /> {t('profile_first_name')}
          </label>
          <input
            className="w-full mt-2 border rounded-lg p-2"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>

        {/* LAST NAME */}
        <div className="bg-white p-5 rounded-xl shadow border">
          <label className="text-sm text-gray-500 flex items-center gap-2">
            <User size={16} /> {t('profile_last_name')}
          </label>
          <input
            className="w-full mt-2 border rounded-lg p-2"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        {/* EMAIL */}
        <div className="bg-white p-5 rounded-xl shadow border">
          <label className="text-sm text-gray-500 flex items-center gap-2">
            <Mail size={16} /> {t('profile_email')}
          </label>
          <p className="mt-2 font-medium">{profile?.email}</p>
        </div>

        {/* ROLE */}
        <div className="bg-white p-5 rounded-xl shadow border">
          <label className="text-sm text-gray-500 flex items-center gap-2">
            <Shield size={16} /> {t('profile_role')}
          </label>
          <p className="mt-2 font-medium capitalize">
            {profile?.role?.replace('_', ' ')}
          </p>
        </div>

        {/* JOIN DATE */}
        <div className="bg-white p-5 rounded-xl shadow border md:col-span-2">
          <label className="text-sm text-gray-500">
            {t('profile_joined')}
          </label>
          <p className="mt-2 font-medium">
            {profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString()
              : "—"}
          </p>
        </div>
      </div>

      {/* SAVE BUTTON */}
      <div className="flex justify-end">
        <button
          onClick={updateProfile}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Save size={18} />
          {saving ? t('profile_saving') : t('profile_save_changes')}
        </button>
      </div>
    </div>
  );
}