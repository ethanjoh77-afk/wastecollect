import { supabase } from "../lib/supabase";

export interface PlatformSettings {
  platform_name: string;
  support_email: string;
  support_phone: string;
  maintenance_mode: boolean;
  default_trial_days: number;
  default_currency: string;
  max_upload_size_mb: number;
}

const DEFAULTS: PlatformSettings = {
  platform_name: "WasteCollect",
  support_email: "",
  support_phone: "",
  maintenance_mode: false,
  default_trial_days: 14,
  default_currency: "TZS",
  max_upload_size_mb: 10,
};

export async function getSettings(): Promise<PlatformSettings> {
  const { data, error } = await supabase.from("system_settings").select("key, value");
  if (error) throw error;

  const result: PlatformSettings = { ...DEFAULTS };
  (data ?? []).forEach((row) => {
    if (row.key in result) {
      (result as Record<string, unknown>)[row.key] = row.value;
    }
  });
  return result;
}

export async function updateSetting(key: keyof PlatformSettings, value: unknown) {
  const { data: authData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("system_settings")
    .update({ value, updated_by: authData.user?.id, updated_at: new Date().toISOString() })
    .eq("key", key)
    .select()
    .single();
  if (error) throw error;

  await supabase.from("audit_logs").insert({
    user_id: authData.user?.id,
    action: "system_setting_updated",
    table_name: "system_settings",
    record_id: key,
    new_values: { [key]: value },
  });

  return data;
}

export async function updateSettings(updates: Partial<PlatformSettings>) {
  const results = await Promise.all(
    Object.entries(updates).map(([key, value]) => updateSetting(key as keyof PlatformSettings, value))
  );
  return results;
}
