import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  Image as ImageIcon,
  LayoutGrid,
  ListOrdered,
  MessageSquareQuote,
  Sparkles,
  Plus,
  Trash2,
  Save,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  GripVertical,
} from "lucide-react";
import { SuperAdminLayout } from "../components/layout/SuperAdminLayout";
import { Button, Card, Input, Textarea, Badge, ConfirmDialog, Skeleton } from "../components/common";
import { useLandingCMS } from "../hooks/useLandingCMS";
import {
  createContent,
  updateContent,
  deleteContent,
  toggleActive,
  reorderContent,
  type LandingContentItem,
  type LandingSection,
} from "../services/landingCmsService";

const TABS: { key: LandingSection; labelKey: string; icon: React.ElementType }[] = [
  { key: "hero", labelKey: "cms_tab_hero", icon: Sparkles },
  { key: "hero_carousel", labelKey: "cms_tab_carousel", icon: ImageIcon },
  { key: "features", labelKey: "cms_tab_features", icon: LayoutGrid },
  { key: "steps", labelKey: "cms_tab_steps", icon: ListOrdered },
  { key: "testimonials", labelKey: "cms_tab_testimonials", icon: MessageSquareQuote },
];

const EMPTY_ITEM = (section: LandingSection): Partial<LandingContentItem> => ({
  section,
  title: "",
  description: "",
  image_url: "",
  icon: "",
  sort_order: 0,
  is_active: true,
});

export default function AdminLandingCMS() {
  const { t } = useTranslation();
  const { sections, loading, error, refresh } = useLandingCMS();
  const [activeTab, setActiveTab] = useState<LandingSection>("hero");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LandingContentItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<LandingContentItem> | null>(null);

  const items = (sections[activeTab] ?? []).slice().sort(
    (a, b) => a.sort_order - b.sort_order
  );

  const handleFieldSave = async (
    id: string,
    field: keyof LandingContentItem,
    value: string
  ) => {
    setSavingId(id);
    try {
      await updateContent(id, { [field]: value });
      toast.success(t("cms_saved"));
    } catch (err) {
      console.error(err);
      toast.error(t("cms_save_failed"));
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleActive = async (item: LandingContentItem) => {
    try {
      await toggleActive(item.id, !item.is_active);
      toast.success(item.is_active ? t("cms_hidden") : t("cms_shown"));
    } catch (err) {
      console.error(err);
      toast.error(t("cms_save_failed"));
    }
  };

  const handleMove = async (item: LandingContentItem, direction: -1 | 1) => {
    const idx = items.findIndex((i) => i.id === item.id);
    const swapWith = items[idx + direction];
    if (!swapWith) return;
    try {
      await Promise.all([
        reorderContent(item.id, swapWith.sort_order),
        reorderContent(swapWith.id, item.sort_order),
      ]);
    } catch (err) {
      console.error(err);
      toast.error(t("cms_save_failed"));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteContent(deleteTarget.id);
      toast.success(t("cms_deleted"));
    } catch (err) {
      console.error(err);
      toast.error(t("cms_delete_failed"));
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleCreate = async () => {
    if (!newItem) return;
    try {
      await createContent({
        section: activeTab,
        title: newItem.title || "",
        description: newItem.description || "",
        image_url: newItem.image_url || "",
        icon: newItem.icon || "",
        sort_order: items.length + 1,
        is_active: true,
      });
      toast.success(t("cms_added"));
      setNewItem(null);
    } catch (err) {
      console.error(err);
      toast.error(t("cms_add_failed"));
    }
  };

  const isCarousel = activeTab === "hero_carousel";

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">
              {t("cms_title")}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              {t("cms_subtitle")}
            </p>
          </div>
          <Button variant="outline" onClick={() => refresh()}>
            {t("cms_refresh")}
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setNewItem(null);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                  active
                    ? "bg-primary-500 text-white shadow-md"
                    : "bg-white dark:bg-slate-800 text-secondary-600 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-slate-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>

        {isCarousel && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800">
            <ImageIcon className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-primary-800 dark:text-primary-200">
              {t("cms_carousel_hint")}
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-300 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item, idx) => (
              <Card key={item.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <GripVertical className="w-4 h-4" />
                    <Badge variant={item.is_active ? "success" : "default"}>
                      {item.is_active ? t("cms_active") : t("cms_hidden_badge")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      title={t("cms_move_up")}
                      disabled={idx === 0}
                      onClick={() => handleMove(item, -1)}
                      className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-slate-700 disabled:opacity-30"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      title={t("cms_move_down")}
                      disabled={idx === items.length - 1}
                      onClick={() => handleMove(item, 1)}
                      className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-slate-700 disabled:opacity-30"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      title={item.is_active ? t("cms_hide") : t("cms_show")}
                      onClick={() => handleToggleActive(item)}
                      className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-slate-700"
                    >
                      {item.is_active ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      title={t("cms_delete")}
                      onClick={() => setDeleteTarget(item)}
                      className="p-1.5 rounded-lg hover:bg-error-50 dark:hover:bg-error-900/20 text-error-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <Input
                  label={t("cms_field_title")}
                  defaultValue={item.title ?? ""}
                  onBlur={(e) =>
                    e.target.value !== item.title &&
                    handleFieldSave(item.id, "title", e.target.value)
                  }
                  disabled={savingId === item.id}
                />

                <Textarea
                  label={t("cms_field_description")}
                  rows={3}
                  defaultValue={item.description ?? ""}
                  onBlur={(e) =>
                    e.target.value !== item.description &&
                    handleFieldSave(item.id, "description", e.target.value)
                  }
                  disabled={savingId === item.id}
                />

                <Input
                  label={
                    isCarousel
                      ? t("cms_field_carousel_image")
                      : t("cms_field_image_optional")
                  }
                  hint={isCarousel ? t("cms_field_carousel_image_hint") : undefined}
                  defaultValue={item.image_url ?? ""}
                  placeholder="/images/hero-slide-1.jpg"
                  onBlur={(e) =>
                    e.target.value !== item.image_url &&
                    handleFieldSave(item.id, "image_url", e.target.value)
                  }
                  disabled={savingId === item.id}
                />

                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.title ?? ""}
                    className="w-full h-28 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}

                {activeTab === "features" && (
                  <Input
                    label={t("cms_field_icon")}
                    hint={t("cms_field_icon_hint")}
                    defaultValue={item.icon ?? ""}
                    placeholder="MapPin"
                    onBlur={(e) =>
                      e.target.value !== item.icon &&
                      handleFieldSave(item.id, "icon", e.target.value)
                    }
                    disabled={savingId === item.id}
                  />
                )}
              </Card>
            ))}

            {/* Add-new card */}
            {newItem ? (
              <Card className="p-4 space-y-3 border-2 border-dashed border-primary-300">
                <Input
                  label={t("cms_field_title")}
                  value={newItem.title ?? ""}
                  onChange={(e) =>
                    setNewItem({ ...newItem, title: e.target.value })
                  }
                />
                <Textarea
                  label={t("cms_field_description")}
                  rows={3}
                  value={newItem.description ?? ""}
                  onChange={(e) =>
                    setNewItem({ ...newItem, description: e.target.value })
                  }
                />
                <Input
                  label={
                    isCarousel
                      ? t("cms_field_carousel_image")
                      : t("cms_field_image_optional")
                  }
                  value={newItem.image_url ?? ""}
                  placeholder="/images/hero-slide-1.jpg"
                  onChange={(e) =>
                    setNewItem({ ...newItem, image_url: e.target.value })
                  }
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleCreate}>
                    <Save className="w-4 h-4" />
                    {t("cms_save")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setNewItem(null)}>
                    {t("cms_cancel")}
                  </Button>
                </div>
              </Card>
            ) : (
              <button
                onClick={() => setNewItem(EMPTY_ITEM(activeTab))}
                className="flex items-center justify-center gap-2 h-full min-h-[12rem] rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:text-primary-500 hover:border-primary-300 transition"
              >
                <Plus className="w-5 h-5" />
                {t("cms_add_item")}
              </button>
            )}
          </div>
        )}

        {!loading && items.length === 0 && !newItem && (
          <p className="text-center text-slate-400 py-8">{t("cms_empty")}</p>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t("cms_delete_confirm_title")}
        message={t("cms_delete_confirm_message")}
        variant="danger"
      />
    </SuperAdminLayout>
  );
}
