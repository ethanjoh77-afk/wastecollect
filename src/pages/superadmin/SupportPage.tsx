import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Search, LifeBuoy, Send, MessageSquare } from "lucide-react";
import { SuperAdminLayout } from "../../components/layout/SuperAdminLayout";
import { DataTable } from "../../components/dashboard";
import { Button, Input, Select, Textarea, Modal, Badge } from "../../components/common";
import type { ComplaintStatus, Priority } from "../../types";
import {
  getTickets,
  getTicketComments,
  addTicketComment,
  updateTicketStatus,
  updateTicketPriority,
  assignTicket,
  getAssignableAdmins,
  type TicketWithRelations,
  type TicketCommentWithUser,
} from "../../services/supportService";

const statusVariant: Record<ComplaintStatus, "warning" | "info" | "success" | "default"> = {
  open: "warning",
  in_progress: "info",
  resolved: "success",
  closed: "default",
};

const priorityVariant: Record<Priority, "default" | "info" | "warning" | "error"> = {
  low: "default",
  medium: "info",
  high: "warning",
  urgent: "error",
};

export default function SupportPage() {
  const { t } = useTranslation();

  const [tickets, setTickets] = useState<TicketWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");

  const [admins, setAdmins] = useState<{ id: string; first_name: string; last_name: string }[]>([]);

  const [activeTicket, setActiveTicket] = useState<TicketWithRelations | null>(null);
  const [comments, setComments] = useState<TicketCommentWithUser[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [resolution, setResolution] = useState("");
  const [savingAction, setSavingAction] = useState(false);

  async function loadTickets() {
    setLoading(true);
    try {
      const data = await getTickets({ status: statusFilter, priority: priorityFilter, search });
      setTickets(data);
    } catch (err) {
      console.error(err);
      toast.error(t("superadmin_support_load_failed"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
    getAssignableAdmins().then(setAdmins).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    const timer = setTimeout(() => loadTickets(), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function openTicket(ticket: TicketWithRelations) {
    setActiveTicket(ticket);
    setResolution(ticket.resolution || "");
    setNewComment("");
    setCommentsLoading(true);
    try {
      setComments(await getTicketComments(ticket.id));
    } catch (err) {
      console.error(err);
      toast.error(t("superadmin_support_comments_load_failed"));
    } finally {
      setCommentsLoading(false);
    }
  }

  async function refreshActiveTicket(updated: Partial<TicketWithRelations>) {
    if (!activeTicket) return;
    const merged = { ...activeTicket, ...updated };
    setActiveTicket(merged);
    setTickets((prev) => prev.map((tk) => (tk.id === merged.id ? { ...tk, ...updated } : tk)));
  }

  async function handleStatusChange(status: ComplaintStatus) {
    if (!activeTicket) return;
    setSavingAction(true);
    try {
      const data = await updateTicketStatus(activeTicket.id, status, resolution);
      refreshActiveTicket(data);
      toast.success(t("superadmin_support_status_updated"));
    } catch (err: any) {
      toast.error(err?.message || t("superadmin_support_action_failed"));
    } finally {
      setSavingAction(false);
    }
  }

  async function handlePriorityChange(priority: Priority) {
    if (!activeTicket) return;
    setSavingAction(true);
    try {
      const data = await updateTicketPriority(activeTicket.id, priority);
      refreshActiveTicket(data);
      toast.success(t("superadmin_support_priority_updated"));
    } catch (err: any) {
      toast.error(err?.message || t("superadmin_support_action_failed"));
    } finally {
      setSavingAction(false);
    }
  }

  async function handleAssign(adminId: string) {
    if (!activeTicket) return;
    setSavingAction(true);
    try {
      const data = await assignTicket(activeTicket.id, adminId || null);
      const admin = admins.find((a) => a.id === adminId);
      refreshActiveTicket({
        ...data,
        assigned_to_name: admin ? `${admin.first_name} ${admin.last_name}`.trim() : undefined,
      });
      toast.success(t("superadmin_support_assigned"));
    } catch (err: any) {
      toast.error(err?.message || t("superadmin_support_action_failed"));
    } finally {
      setSavingAction(false);
    }
  }

  async function handleAddComment() {
    if (!activeTicket || !newComment.trim()) return;
    setSavingAction(true);
    try {
      await addTicketComment(activeTicket.id, newComment.trim());
      setNewComment("");
      setComments(await getTicketComments(activeTicket.id));
    } catch (err: any) {
      toast.error(err?.message || t("superadmin_support_action_failed"));
    } finally {
      setSavingAction(false);
    }
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
            {t("superadmin_nav_support")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">{t("superadmin_support_subtitle")}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder={t("superadmin_support_search_placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ComplaintStatus | "all")}
            options={[
              { value: "all", label: t("superadmin_support_filter_all_status") },
              { value: "open", label: t("superadmin_support_status_open") },
              { value: "in_progress", label: t("superadmin_support_status_in_progress") },
              { value: "resolved", label: t("superadmin_support_status_resolved") },
              { value: "closed", label: t("superadmin_support_status_closed") },
            ]}
          />
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as Priority | "all")}
            options={[
              { value: "all", label: t("superadmin_support_filter_all_priority") },
              { value: "low", label: t("superadmin_support_priority_low") },
              { value: "medium", label: t("superadmin_support_priority_medium") },
              { value: "high", label: t("superadmin_support_priority_high") },
              { value: "urgent", label: t("superadmin_support_priority_urgent") },
            ]}
          />
        </div>

        <DataTable<TicketWithRelations>
          isLoading={loading}
          data={tickets}
          keyExtractor={(tk) => tk.id}
          onRowClick={openTicket}
          emptyState={
            <div className="text-center py-14">
              <LifeBuoy className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">{t("superadmin_support_none_found")}</p>
            </div>
          }
          columns={[
            {
              key: "subject",
              header: t("superadmin_support_col_subject"),
              render: (tk) => (
                <div>
                  <p className="font-medium text-secondary-900 dark:text-white">
                    {tk.subject || tk.complaint_type}
                  </p>
                  <p className="text-xs text-slate-400">
                    {tk.citizen_name || tk.citizen_email || "—"}
                  </p>
                </div>
              ),
            },
            {
              key: "priority",
              header: t("superadmin_support_col_priority"),
              render: (tk) => (
                <Badge variant={priorityVariant[tk.priority]}>
                  {t(`superadmin_support_priority_${tk.priority}`)}
                </Badge>
              ),
            },
            {
              key: "status",
              header: t("superadmin_support_col_status"),
              render: (tk) => (
                <Badge variant={statusVariant[tk.status]} dot>
                  {t(`superadmin_support_status_${tk.status}`)}
                </Badge>
              ),
            },
            {
              key: "assigned_to_name",
              header: t("superadmin_support_col_assigned"),
              render: (tk) => tk.assigned_to_name || t("superadmin_support_unassigned"),
            },
            {
              key: "created_at",
              header: t("superadmin_support_col_created"),
              render: (tk) => new Date(tk.created_at).toLocaleDateString(),
            },
          ]}
        />
      </div>

      <Modal
        isOpen={!!activeTicket}
        onClose={() => setActiveTicket(null)}
        title={activeTicket?.subject || activeTicket?.complaint_type}
        size="xl"
      >
        {activeTicket && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label={t("superadmin_support_field_status")}
                value={activeTicket.status}
                onChange={(e) => handleStatusChange(e.target.value as ComplaintStatus)}
                disabled={savingAction}
                options={[
                  { value: "open", label: t("superadmin_support_status_open") },
                  { value: "in_progress", label: t("superadmin_support_status_in_progress") },
                  { value: "resolved", label: t("superadmin_support_status_resolved") },
                  { value: "closed", label: t("superadmin_support_status_closed") },
                ]}
              />
              <Select
                label={t("superadmin_support_field_priority")}
                value={activeTicket.priority}
                onChange={(e) => handlePriorityChange(e.target.value as Priority)}
                disabled={savingAction}
                options={[
                  { value: "low", label: t("superadmin_support_priority_low") },
                  { value: "medium", label: t("superadmin_support_priority_medium") },
                  { value: "high", label: t("superadmin_support_priority_high") },
                  { value: "urgent", label: t("superadmin_support_priority_urgent") },
                ]}
              />
              <Select
                label={t("superadmin_support_field_assigned")}
                value={activeTicket.assigned_to || ""}
                onChange={(e) => handleAssign(e.target.value)}
                disabled={savingAction}
                placeholder={t("superadmin_support_unassigned")}
                options={admins.map((a) => ({ value: a.id, label: `${a.first_name} ${a.last_name}` }))}
              />
            </div>

            <div>
              <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                {t("superadmin_support_field_description")}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 whitespace-pre-wrap">
                {activeTicket.description || "—"}
              </p>
            </div>

            <Textarea
              label={t("superadmin_support_field_resolution")}
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={3}
              hint={t("superadmin_support_resolution_hint")}
            />

            <div>
              <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> {t("superadmin_support_comments_title")}
              </p>

              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {commentsLoading ? (
                  <p className="text-sm text-slate-400">{t("superadmin_support_comments_loading")}</p>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-slate-400">{t("superadmin_support_comments_none")}</p>
                ) : (
                  comments.map((c) => (
                    <div
                      key={c.id}
                      className="bg-secondary-50 dark:bg-slate-700/50 rounded-xl px-4 py-3"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-secondary-700 dark:text-secondary-300">
                          {c.user_name || t("superadmin_support_comment_unknown_user")}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(c.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400 whitespace-pre-wrap">
                        {c.comment}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-end gap-2 mt-3">
                <div className="flex-1">
                  <Textarea
                    placeholder={t("superadmin_support_comment_placeholder")}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={2}
                  />
                </div>
                <Button
                  onClick={handleAddComment}
                  isLoading={savingAction}
                  disabled={!newComment.trim()}
                  leftIcon={<Send className="w-4 h-4" />}
                >
                  {t("superadmin_support_comment_send")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </SuperAdminLayout>
  );
}
