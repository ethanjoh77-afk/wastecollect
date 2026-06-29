import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { User, Mail, Shield, Save } from "lucide-react";

type Profile = {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
};

export default function ProfilePage() {
  const { user } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");

  // ================= FETCH =================
  const fetchProfile = async () => {
    if (!user) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setProfile(data);
    setName(data?.name || "");
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
      .from("profiles")
      .update({ name })
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      alert("Update failed");
      return;
    }

    alert("Profile updated");
    fetchProfile();
  };

  if (loading) {
    return (
      <div className="p-6 text-gray-500">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-2xl shadow">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User /> My Profile
        </h1>
        <p className="text-sm opacity-80">
          Manage your account information
        </p>
      </div>

      {/* PROFILE CARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* NAME */}
        <div className="bg-white p-5 rounded-xl shadow border">
          <label className="text-sm text-gray-500 flex items-center gap-2">
            <User size={16} /> Name
          </label>

          <input
            className="w-full mt-2 border rounded-lg p-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* EMAIL */}
        <div className="bg-white p-5 rounded-xl shadow border">
          <label className="text-sm text-gray-500 flex items-center gap-2">
            <Mail size={16} /> Email
          </label>

          <p className="mt-2 font-medium">{profile?.email}</p>
        </div>

        {/* ROLE */}
        <div className="bg-white p-5 rounded-xl shadow border">
          <label className="text-sm text-gray-500 flex items-center gap-2">
            <Shield size={16} /> Role
          </label>

          <p className="mt-2 font-medium capitalize">
            {profile?.role}
          </p>
        </div>

        {/* JOIN DATE */}
        <div className="bg-white p-5 rounded-xl shadow border">
          <label className="text-sm text-gray-500">
            Joined
          </label>

          <p className="mt-2 font-medium">
            {new Date(profile?.created_at || "").toLocaleDateString()}
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
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}