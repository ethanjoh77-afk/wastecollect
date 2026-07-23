import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Inbox, Search, StickyNote, UserPlus, Archive, Download, Mail } from "lucide-react";
import { SuperAdminLayout } from "../../components/layout/SuperAdminLayout";
import { Input, Select, Modal, Textarea, Button, Badge } from "../../components/common";
import {
  getForwardedMessages,
  addInternalNote,
  assignTask,
  closeTicket,
  updateMessagePriority,
  getAssignableAdmins,
  exportTicketAsText,
  type ContactMessageEntry,
  type ContactStatus,
  type ContactPriority,
} from "../../services/contactMessagesService";

const statusVariant: Record<ContactStatus, "default" | "info" | "warning" | "success" | "error"> = {
  NEW: "info",
  UNDER_REVIEW: "warning",
  FORWARDED: "info",
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

export default function ContactCenterPage() {
  const { t } = useTranslation();

  const [messages, setMessages] = useState<ContactMessageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContactStatus | "all">("all");
  const [admins, setAdmins] = useState<{ id: string; first_name: string; last_name: string; email: string }[]>([]);

  const [activeMsg, setActiveMsg] = useState<ContactMessageEntry | null>(null);
  const [noteText, setNoteText] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadMessages() {
    setLoading(true);
    try {
      const data = await getForwardedMessages({ status: statusFilter, search });
      setMessages(data);
    } catch (err) {
      console.error(err);
      toast.error(t("csm_load_failed", "Imeshindikana kupakia ujumbe"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getAssignableAdmins().then(setAdmins).catch(console.error);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(loadMessages, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  function openMessage(msg: ContactMessageEntry) {
    setActiveMsg(msg);
    setNoteText(msg.internal_note ?? "");
    setAssigneeId(msg.admin_id ?? "");
  }

  async function handleSaveNote() {
    if (!activeMsg) return;
    setSaving(true);
    try {
      await addInternalNote(activeMsg.id, noteText);
      toast.success(t("csm_note_saved", "Maelezo yamehifadhiwa"));
      loadMessages();
    } catch (err: any) {
      toast.error(err?.message || t("csm_action_failed", "Kitendo kimeshindikana"));
    } finally {
      setSaving(false);
    }
  }

  async function handleAssign() {
    if (!activeMsg || !assigneeId) return;
    setSaving(true);
    try {
      await assignTask(activeMsg.id, assigneeId);
      toast.success(t("csm_assigned", "Kazi imepangwa"));
      loadMessages();
    } catch (err: any) {
      toast.error(err?.message || t("csm_action_failed", "Kitendo kimeshindikana"));
    } finally {
      setSaving(false);
    }
  }

  async function handlePriorityChange(priority: ContactPriority) {
    if (!activeMsg) return;
    try {
      await updateMessagePriority(activeMsg.id, priority);
      setActiveMsg({ ...activeMsg, priority });
      toast.success(t("csm_priority_updated", "Kipaumbele kimesasishwa"));
      loadMessages();
    } catch (err: any) {
      toast.error(err?.message || t("csm_action_failed", "Kitendo kimeshindikana"));
    }
  }

  async function handleClose() {
    if (!activeMsg) return;
    setSaving(true);
    try {
      await closeTicket(activeMsg.id);
      toast.success(t("csm_closed", "Ticket imefungwa"));
      setActiveMsg(null);
      loadMessages();
    } catch (err: any) {
      toast.error(err?.message || t("csm_action_failed", "Kitendo kimeshindikana"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white flex items-center gap-2">
            <Inbox className="w-6 h-6" />
            {t("csm_super_title", "Kituo cha Msaada")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {t("csm_super_subtitle", "Ujumbe uliofikishwa na wasimamizi kwa uangalizi wako")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
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
              { value: "FORWARDED", label: t("csm_status_forwarded", "Imefikishwa") },
              { value: "REPLIED", label: t("csm_status_replied", "Imejibiwa") },
              { value: "RESOLVED", label: t("csm_status_resolved", "Imetatuliwa") },
              { value: "ARCHIVED", label: t("csm_status_archived", "Imefungwa") },
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
            <p className="text-slate-500">
              {t("csm_no_forwarded", "Hakuna ujumbe uliofikishwa bado")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => openMessage(msg)}
                className="bg-white dark:bg-slate-800 rounded-xl shadow p-5 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-secondary-900 dark:text-white">{msg.name}</p>
                    <p className="text-sm text-slate-500">{msg.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={priorityVariant[msg.priority]}>{msg.priority}</Badge>
                    <Badge variant={statusVariant[msg.status] as any}>{msg.status.replaceAll("_", " ")}</Badge>
                  </div>
                </div>
                {msg.subject && <p className="text-sm font-medium mb-1">{msg.subject}</p>}
                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{msg.message}</p>
                <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
                  <span>
                    {t("csm_forwarded_by", "Umefikishwa na")}: {msg.admin_name ?? "—"}
                  </span>
                  <span>{msg.forwarded_at ? new Date(msg.forwarded_at).toLocaleString() : ""}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={!!activeMsg}
        onClose={() => setActiveMsg(null)}
        title={activeMsg?.name}
        size="lg"
      >
        {activeMsg && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900">
              <p className="text-sm font-medium mb-1">{activeMsg.subject}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{activeMsg.message}</p>
              {activeMsg.reply && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-medium text-primary-600 mb-1">
                    {t("csm_admin_reply", "Jibu la Admin")} ({activeMsg.reply_by_name}):
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{activeMsg.reply}</p>
                </div>
              )}
            </div>

            <Select
              label={t("csm_field_priority", "Kipaumbele")}
              value={activeMsg.priority}
              onChange={(e) => handlePriorityChange(e.target.value as ContactPriority)}
              options={[
                { value: "LOW", label: t("csm_priority_low", "Chini") },
                { value: "MEDIUM", label: t("csm_priority_medium", "Wastani") },
                { value: "HIGH", label: t("csm_priority_high", "Juu") },
                { value: "URGENT", label: t("csm_priority_urgent", "Dharura") },
              ]}
            />

            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Select
                  label={t("csm_field_assign", "Mpangie Kazi")}
                  placeholder={t("csm_select_admin", "-- Chagua Admin --")}
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  options={admins.map((a) => ({
                    value: a.id,
                    label: `${a.first_name} ${a.last_name} (${a.email})`,
                  }))}
                />
              </div>
              <Button
                variant="secondary"
                leftIcon={<UserPlus className="w-4 h-4" />}
                onClick={handleAssign}
                isLoading={saving}
              >
                {t("csm_assign_btn", "Panga")}
              </Button>
            </div>

            <Textarea
              label={t("csm_field_internal_note", "Maelezo ya Ndani (Super Admin pekee)")}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
            />

            <div className="flex flex-wrap justify-between gap-3 pt-2">
              <Button
                variant="secondary"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={() => exportTicketAsText(activeMsg)}
              >
                {t("csm_export", "Hamisha (Export)")}
              </Button>

              <div className="flex gap-3">
                <Button variant="secondary" onClick={handleSaveNote} isLoading={saving}>
                  <StickyNote className="w-4 h-4 mr-1" />
                  {t("csm_save_note", "Hifadhi Maelezo")}
                </Button>
                <Button variant="danger" leftIcon={<Archive className="w-4 h-4" />} onClick={handleClose} isLoading={saving}>
                  {t("csm_close_ticket", "Funga Ticket")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </SuperAdminLayout>
  );
}