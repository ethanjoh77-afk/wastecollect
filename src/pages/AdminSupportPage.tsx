import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Mail, Search, Send, Forward, CheckCircle2, Archive, Trash2, Clock } from "lucide-react";
import { DashboardLayout } from "../components/layout";
import { Input, Select, Modal, Textarea, Button, Badge, ConfirmDialog } from "../components/common";
import {
  getAdminMessages,
  markUnderReview,
  replyToMessage,
  forwardToSuperAdmin,
  resolveMessage,
  archiveMessage,
  softDeleteMessage,
  type ContactMessageEntry,
  type ContactStatus,
  type ContactPriority,
} from "../services/contactMessagesService";

const statusVariant: Record<ContactStatus, "default" | "info" | "warning" | "success" | "error"> = {
  NEW: "info",
  UNDER_REVIEW: "warning",
  FORWARDED: "primary" as any,
  REPLIED: "success",
  RESOLVED: "success",
  ARCHIVED: "default",
};

const priorityVariant: Record<ContactPriority, "default" | "info" | "warning" | "error"> = {
  LOW: "default",
  MEDIUM: "info",
  HIGH: "warning",
  URGENT: "error",
};

export default function AdminSupportPage() {
  const { t } = useTranslation();

  const [messages, setMessages] = useState<ContactMessageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContactStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<ContactPriority | "all">("all");
  const [sort, setSort] = useState<"newest" | "unread" | "resolved">("newest");

  const [replyTarget, setReplyTarget] = useState<ContactMessageEntry | null>(null);
  const [replyText, setReplyText] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ContactMessageEntry | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  async function loadMessages() {
    setLoading(true);
    try {
      const data = await getAdminMessages({
        status: statusFilter,
        priority: priorityFilter,
        search,
        sort,
      });
      setMessages(data);
    } catch (err) {
      console.error(err);
      toast.error(t("csm_load_failed", "Imeshindikana kupakia ujumbe"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(loadMessages, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, priorityFilter, sort]);

  async function handleOpen(msg: ContactMessageEntry) {
    if (msg.status === "NEW") {
      try {
        await markUnderReview(msg.id);
        loadMessages();
      } catch (err) {
        console.error(err);
      }
    }
  }

  async function handleReplySend() {
    if (!replyTarget || !replyText.trim()) return;
    setActionLoadingId(replyTarget.id);
    try {
      await replyToMessage(replyTarget.id, replyText.trim());
      toast.success(t("csm_reply_sent", "Jibu limetumwa"));
      setReplyTarget(null);
      setReplyText("");
      loadMessages();
    } catch (err: any) {
      toast.error(err?.message || t("csm_action_failed", "Kitendo kimeshindikana"));
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleForward(msg: ContactMessageEntry) {
    setActionLoadingId(msg.id);
    try {
      await forwardToSuperAdmin(msg.id);
      toast.success(t("csm_forwarded", "Umefikisha kwa Super Admin"));
      loadMessages();
    } catch (err: any) {
      toast.error(err?.message || t("csm_action_failed", "Kitendo kimeshindikana"));
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleResolve(msg: ContactMessageEntry) {
    setActionLoadingId(msg.id);
    try {
      await resolveMessage(msg.id);
      toast.success(t("csm_resolved", "Imetatuliwa"));
      loadMessages();
    } catch (err: any) {
      toast.error(err?.message || t("csm_action_failed", "Kitendo kimeshindikana"));
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleArchive(msg: ContactMessageEntry) {
    setActionLoadingId(msg.id);
    try {
      await archiveMessage(msg.id);
      toast.success(t("csm_archived", "Imewekwa kumbukumbu"));
      loadMessages();
    } catch (err: any) {
      toast.error(err?.message || t("csm_action_failed", "Kitendo kimeshindikana"));
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setActionLoadingId(deleteTarget.id);
    try {
      await softDeleteMessage(deleteTarget.id);
      toast.success(t("csm_deleted", "Ujumbe umefutwa"));
      setDeleteTarget(null);
      loadMessages();
    } catch (err: any) {
      toast.error(err?.message || t("csm_action_failed", "Kitendo kimeshindikana"));
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white flex items-center gap-2">
            <Mail className="w-6 h-6" />
            {t("csm_admin_title", "Ujumbe wa Mawasiliano")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {t("csm_admin_subtitle", "Pitia, jibu, na simamia ujumbe kutoka kwa wageni na wananchi")}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder={t("csm_search_placeholder", "Tafuta kwa jina, barua pepe, au ujumbe...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ContactStatus | "all")}
            options={[
              { value: "all", label: t("csm_filter_all_status", "Hali Zote") },
              { value: "NEW", label: t("csm_status_new", "Mpya") },
              { value: "UNDER_REVIEW", label: t("csm_status_under_review", "Inakaguliwa") },
              { value: "FORWARDED", label: t("csm_status_forwarded", "Imefikishwa") },
              { value: "REPLIED", label: t("csm_status_replied", "Imejibiwa") },
              { value: "RESOLVED", label: t("csm_status_resolved", "Imetatuliwa") },
              { value: "ARCHIVED", label: t("csm_status_archived", "Kumbukumbu") },
            ]}
          />
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as ContactPriority | "all")}
            options={[
              { value: "all", label: t("csm_filter_all_priority", "Kipaumbele Chote") },
              { value: "LOW", label: t("csm_priority_low", "Chini") },
              { value: "MEDIUM", label: t("csm_priority_medium", "Wastani") },
              { value: "HIGH", label: t("csm_priority_high", "Juu") },
              { value: "URGENT", label: t("csm_priority_urgent", "Dharura") },
            ]}
          />
          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value as "newest" | "unread" | "resolved")}
            options={[
              { value: "newest", label: t("csm_sort_newest", "Mpya Zaidi") },
              { value: "unread", label: t("csm_sort_unread", "Hazijasomwa") },
              { value: "resolved", label: t("csm_sort_resolved", "Zilizotatuliwa") },
            ]}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl">
            <Mail className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">{t("csm_none_found", "Hakuna ujumbe unaolingana")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => handleOpen(msg)}
                className="bg-white dark:bg-slate-800 rounded-xl shadow p-5 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-secondary-900 dark:text-white">{msg.name}</p>
                    <a
                      href={`mailto:${msg.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      {msg.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={priorityVariant[msg.priority]}>{msg.priority}</Badge>
                    <Badge variant={statusVariant[msg.status] as any}>{msg.status.replaceAll("_", " ")}</Badge>
                  </div>
                </div>

                {msg.subject && (
                  <p className="text-sm font-medium text-secondary-800 dark:text-slate-200 mb-1">
                    {msg.subject}
                  </p>
                )}
                <p className="text-sm text-slate-600 dark:text-slate-300">{msg.message}</p>

                {msg.reply && (
                  <div className="mt-3 p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800">
                    <p className="text-xs font-medium text-primary-700 dark:text-primary-400 mb-1">
                      {t("csm_your_reply", "Jibu lako")}:
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{msg.reply}</p>
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(msg.created_at).toLocaleString()}
                    {msg.ticket_number && ` · ${msg.ticket_number}`}
                  </span>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="secondary"
                      leftIcon={<Send className="w-3.5 h-3.5" />}
                      onClick={() => {
                        setReplyTarget(msg);
                        setReplyText(msg.reply ?? "");
                      }}
                    >
                      {t("csm_reply", "Jibu")}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      leftIcon={<Forward className="w-3.5 h-3.5" />}
                      onClick={() => handleForward(msg)}
                      isLoading={actionLoadingId === msg.id}
                      disabled={msg.forwarded_to_super_admin}
                    >
                      {msg.forwarded_to_super_admin
                        ? t("csm_forwarded_label", "Imefikishwa")
                        : t("csm_forward", "Fikisha")}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      onClick={() => handleResolve(msg)}
                      isLoading={actionLoadingId === msg.id}
                    >
                      {t("csm_resolve_btn", "Tatua")}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      leftIcon={<Archive className="w-3.5 h-3.5" />}
                      onClick={() => handleArchive(msg)}
                      isLoading={actionLoadingId === msg.id}
                    >
                      {t("csm_archive_btn", "Weka Kumbukumbu")}
                    </Button>
                    <button
                      onClick={() => setDeleteTarget(msg)}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title={t("csm_delete", "Futa")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={!!replyTarget}
        onClose={() => setReplyTarget(null)}
        title={t("csm_reply_to", "Jibu {{name}}", { name: replyTarget?.name })}
        size="md"
      >
        <div className="space-y-4">
          <Textarea
            label={t("csm_your_reply", "Jibu lako")}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={5}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setReplyTarget(null)}>
              {t("superadmin_companies_cancel", "Ghairi")}
            </Button>
            <Button onClick={handleReplySend} isLoading={!!actionLoadingId}>
              {t("csm_send_reply", "Tuma Jibu")}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={t("csm_delete_title", "Futa Ujumbe")}
        message={t("csm_delete_desc", "Una uhakika unataka kufuta ujumbe huu? Utaondolewa kwenye orodha lakini utabaki kwenye database (soft delete).")}
        confirmText={t("csm_delete", "Futa")}
        cancelText={t("superadmin_companies_cancel", "Ghairi")}
        variant="danger"
        isLoading={!!actionLoadingId}
      />
    </DashboardLayout>
  );
}
