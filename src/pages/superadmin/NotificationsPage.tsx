import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Send, Bell, Trash2 } from "lucide-react";
import { SuperAdminLayout } from "../../components/layout/SuperAdminLayout";
import { DataTable } from "../../components/dashboard";
import { Button, Input, Select, Textarea, Modal, ConfirmDialog, Badge } from "../../components/common";
import type { NotificationType, UserRole } from "../../types";
import {
  getSentNotifications,
  getRecipientOptions,
  sendNotification,
  deleteNotification,
  type NotificationWithRecipient,
  type RecipientOption,
  type SendNotificationInput,
} from "../../services/notificationsService";

const emptyForm: SendNotificationInput = {
  title: "",
  message: "",
  sent_via: "push",
  target: "all",
  user_id: "",
  role: undefined,
};

const channelVariant: Record<NotificationType, "info" | "primary" | "default"> = {
  push: "primary",
  sms: "info",
  email: "default",
};

export default function NotificationsPage() {
  const { t } = useTranslation();

  const [notifications, setNotifications] = useState<NotificationWithRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipients, setRecipients] = useState<RecipientOption[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<SendNotificationInput>(emptyForm);
  const [isSending, setIsSending] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<NotificationWithRecipient | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadNotifications() {
    setLoading(true);
    try {
      setNotifications(await getSentNotifications());
    } catch (err) {
      console.error(err);
      toast.error(t("superadmin_notifications_load_failed"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function openComposeModal() {
    setFormData(emptyForm);
    setIsModalOpen(true);
    try {
      setRecipients(await getRecipientOptions());
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSend() {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error(t("superadmin_notifications_required_fields"));
      return;
    }
    if (formData.target === "user" && !formData.user_id) {
      toast.error(t("superadmin_notifications_select_user"));
      return;
    }
    if (formData.target === "role" && !formData.role) {
      toast.error(t("superadmin_notifications_select_role"));
      return;
    }

    setIsSending(true);
    try {
      const result = await sendNotification(formData);
      toast.success(t("superadmin_notifications_sent", { count: result.count }));
      setIsModalOpen(false);
      loadNotifications();
    } catch (err: any) {
      toast.error(err?.message || t("superadmin_notifications_send_failed"));
    } finally {
      setIsSending(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await deleteNotification(deleteTarget.id);
      toast.success(t("superadmin_notifications_deleted"));
      setDeleteTarget(null);
      loadNotifications();
    } catch (err: any) {
      toast.error(err?.message || t("superadmin_notifications_action_failed"));
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
              {t("superadmin_nav_notifications")}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">{t("superadmin_notifications_subtitle")}</p>
          </div>
          <Button leftIcon={<Send className="w-4 h-4" />} onClick={openComposeModal}>
            {t("superadmin_notifications_compose")}
          </Button>
        </div>

        <DataTable<NotificationWithRecipient>
          isLoading={loading}
          data={notifications}
          keyExtractor={(n) => n.id}
          emptyState={
            <div className="text-center py-14">
              <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">{t("superadmin_notifications_none_found")}</p>
            </div>
          }
          columns={[
            {
              key: "title",
              header: t("superadmin_notifications_col_title"),
              render: (n) => (
                <div>
                  <p className="font-medium text-secondary-900 dark:text-white">{n.title}</p>
                  <p className="text-xs text-slate-400 line-clamp-1">{n.message}</p>
                </div>
              ),
            },
            {
              key: "recipient_name",
              header: t("superadmin_notifications_col_recipient"),
              render: (n) => n.recipient_name || n.recipient_email || "—",
            },
            {
              key: "sent_via",
              header: t("superadmin_notifications_col_channel"),
              render: (n) => (
                <Badge variant={n.sent_via ? channelVariant[n.sent_via] : "default"}>
                  {n.sent_via ? t(`superadmin_notifications_channel_${n.sent_via}`) : "—"}
                </Badge>
              ),
            },
            {
              key: "is_read",
              header: t("superadmin_notifications_col_read"),
              render: (n) => (
                <Badge variant={n.is_read ? "success" : "warning"} dot>
                  {n.is_read
                    ? t("superadmin_notifications_read")
                    : t("superadmin_notifications_unread")}
                </Badge>
              ),
            },
            {
              key: "created_at",
              header: t("superadmin_notifications_col_sent_at"),
              render: (n) => new Date(n.created_at).toLocaleString(),
            },
            {
              key: "actions",
              header: "",
              render: (n) => (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(n);
                  }}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  title={t("superadmin_notifications_delete")}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              ),
            },
          ]}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t("superadmin_notifications_compose_title")}
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label={t("superadmin_notifications_field_target")}
            value={formData.target}
            onChange={(e) =>
              setFormData({
                ...formData,
                target: e.target.value as SendNotificationInput["target"],
                user_id: "",
                role: undefined,
              })
            }
            options={[
              { value: "all", label: t("superadmin_notifications_target_all") },
              { value: "role", label: t("superadmin_notifications_target_role") },
              { value: "user", label: t("superadmin_notifications_target_user") },
            ]}
          />

          {formData.target === "role" && (
            <Select
              label={t("superadmin_notifications_field_role")}
              placeholder={t("superadmin_notifications_select_role_placeholder")}
              value={formData.role || ""}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              options={[
                { value: "citizen", label: t("register_role_citizen", "Mkazi") },
                { value: "driver", label: t("register_role_driver", "Dereva") },
                { value: "company_admin", label: t("register_role_company_admin", "Company Admin") },
                {
                  value: "municipality_admin",
                  label: t("register_role_municipality_admin", "Municipality Admin"),
                },
              ]}
            />
          )}

          {formData.target === "user" && (
            <Select
              label={t("superadmin_notifications_field_user")}
              placeholder={t("superadmin_notifications_select_user_placeholder")}
              value={formData.user_id || ""}
              onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
              options={recipients.map((r) => ({ value: r.id, label: `${r.name} (${r.email})` }))}
            />
          )}

          <Input
            label={t("superadmin_notifications_field_title")}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <Textarea
            label={t("superadmin_notifications_field_message")}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            rows={4}
            required
          />

          <Select
            label={t("superadmin_notifications_field_channel")}
            value={formData.sent_via}
            onChange={(e) =>
              setFormData({ ...formData, sent_via: e.target.value as NotificationType })
            }
            options={[
              { value: "push", label: t("superadmin_notifications_channel_push") },
              { value: "sms", label: t("superadmin_notifications_channel_sms") },
              { value: "email", label: t("superadmin_notifications_channel_email") },
            ]}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              {t("superadmin_companies_cancel")}
            </Button>
            <Button onClick={handleSend} isLoading={isSending} leftIcon={<Send className="w-4 h-4" />}>
              {t("superadmin_notifications_send")}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={t("superadmin_notifications_delete_title")}
        message={t("superadmin_notifications_delete_desc")}
        confirmText={t("superadmin_companies_delete")}
        cancelText={t("superadmin_companies_cancel")}
        variant="danger"
        isLoading={actionLoading}
      />
    </SuperAdminLayout>
  );
}
