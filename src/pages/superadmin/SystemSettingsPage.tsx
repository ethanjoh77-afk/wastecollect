import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Settings as SettingsIcon, Save, Power } from "lucide-react";
import { SuperAdminLayout } from "../../components/layout/SuperAdminLayout";
import { Card, CardHeader, CardTitle, CardContent, Input, Button, Badge } from "../../components/common";
import { getSettings, updateSettings, type PlatformSettings } from "../../services/systemSettingsService";

export default function SystemSettingsPage() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        setSettings(await getSettings());
      } catch (err) {
        console.error(err);
        toast.error(t("superadmin_settings_load_failed"));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update<K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    try {
      await updateSettings(settings);
      toast.success(t("superadmin_settings_saved"));
    } catch (err: any) {
      toast.error(err?.message || t("superadmin_settings_save_failed"));
    } finally {
      setSaving(false);
    }
  }

  if (loading || !settings) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
              {t("superadmin_nav_settings")}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">{t("superadmin_settings_subtitle")}</p>
          </div>
          <Button onClick={handleSave} isLoading={saving} leftIcon={<Save className="w-4 h-4" />}>
            {t("superadmin_settings_save")}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" /> {t("superadmin_settings_general_title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label={t("superadmin_settings_platform_name")}
              value={settings.platform_name}
              onChange={(e) => update("platform_name", e.target.value)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t("superadmin_settings_support_email")}
                type="email"
                value={settings.support_email}
                onChange={(e) => update("support_email", e.target.value)}
              />
              <Input
                label={t("superadmin_settings_support_phone")}
                value={settings.support_phone}
                onChange={(e) => update("support_phone", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Power className="w-5 h-5" /> {t("superadmin_settings_maintenance_title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-secondary-50 dark:bg-slate-700/50 rounded-xl">
              <div>
                <p className="font-medium text-secondary-900 dark:text-white">
                  {t("superadmin_settings_maintenance_mode")}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("superadmin_settings_maintenance_hint")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={settings.maintenance_mode ? "error" : "success"} dot>
                  {settings.maintenance_mode
                    ? t("superadmin_settings_maintenance_on")
                    : t("superadmin_settings_maintenance_off")}
                </Badge>
                <Button
                  variant={settings.maintenance_mode ? "secondary" : "danger"}
                  onClick={() => update("maintenance_mode", !settings.maintenance_mode)}
                >
                  {settings.maintenance_mode
                    ? t("superadmin_settings_maintenance_disable")
                    : t("superadmin_settings_maintenance_enable")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("superadmin_settings_billing_title")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label={t("superadmin_settings_trial_days")}
              type="number"
              min={0}
              value={settings.default_trial_days}
              onChange={(e) => update("default_trial_days", Number(e.target.value))}
            />
            <Input
              label={t("superadmin_settings_currency")}
              value={settings.default_currency}
              onChange={(e) => update("default_currency", e.target.value)}
            />
            <Input
              label={t("superadmin_settings_max_upload")}
              type="number"
              min={1}
              value={settings.max_upload_size_mb}
              onChange={(e) => update("max_upload_size_mb", Number(e.target.value))}
            />
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}
