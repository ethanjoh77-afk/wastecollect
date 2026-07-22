import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  Pencil,
  Ban,
  CheckCircle2,
  Trash2,
  Building2,
} from "lucide-react";
import { SuperAdminLayout } from "../../components/layout/SuperAdminLayout";
import { DataTable } from "../../components/dashboard";
import { Button, Input, Select, Textarea, Modal, ConfirmDialog, Badge } from "../../components/common";
import {
  getCompanies,
  getMunicipalitiesForSelect,
  getCompanyAdminsForSelect,
  createCompany,
  updateCompany,
  suspendCompany,
  activateCompany,
  deleteCompany,
  type CompanyWithRelations,
  type CompanyFormInput,
} from "../../services/companyManagementService";

const emptyForm: CompanyFormInput = {
  name: "",
  registration_number: "",
  municipality_id: "",
  contact_person: "",
  phone: "",
  email: "",
  address: "",
  admin_id: "",
  subscription_plan: "trial",
  billing_email: "",
};

const planVariant: Record<string, "default" | "info" | "primary" | "success"> = {
  trial: "default",
  standard: "info",
  professional: "primary",
  enterprise: "success",
};

export default function CompaniesManagementPage() {
  const { t } = useTranslation();

  const [companies, setCompanies] = useState<CompanyWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [municipalities, setMunicipalities] = useState<{ id: string; name: string }[]>([]);
  const [admins, setAdmins] = useState<{ id: string; first_name: string; last_name: string; email: string }[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CompanyFormInput>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const [suspendTarget, setSuspendTarget] = useState<CompanyWithRelations | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CompanyWithRelations | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadCompanies() {
    setLoading(true);
    try {
      const data = await getCompanies();
      setCompanies(data);
    } catch (err) {
      console.error(err);
      toast.error(t("superadmin_companies_load_failed"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCompanies();
    getMunicipalitiesForSelect().then(setMunicipalities).catch(console.error);
    getCompanyAdminsForSelect().then(setAdmins).catch(console.error);
  }, []);

  function openCreateModal() {
    setEditingId(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  }

  function openEditModal(company: CompanyWithRelations) {
    setEditingId(company.id);
    setFormData({
      name: company.name,
      registration_number: company.registration_number,
      municipality_id: company.municipality_id,
      contact_person: company.contact_person ?? "",
      phone: company.phone ?? "",
      email: company.email ?? "",
      address: company.address ?? "",
      admin_id: company.admin_id ?? "",
      subscription_plan: company.subscription_plan ?? "trial",
      billing_email: company.billing_email ?? "",
    });
    setIsModalOpen(true);
  }

  async function handleSave() {
    if (!formData.name.trim() || !formData.registration_number.trim() || !formData.municipality_id) {
      toast.error(t("superadmin_companies_required_fields"));
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        await updateCompany(editingId, formData);
        toast.success(t("superadmin_companies_updated"));
      } else {
        await createCompany(formData);
        toast.success(t("superadmin_companies_created"));
      }
      setIsModalOpen(false);
      loadCompanies();
    } catch (err: any) {
      toast.error(err?.message || t("superadmin_companies_save_failed"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSuspendConfirm() {
    if (!suspendTarget) return;
    setActionLoading(true);
    try {
      await suspendCompany(suspendTarget.id, suspendReason || t("superadmin_companies_no_reason"));
      toast.success(t("superadmin_companies_suspended"));
      setSuspendTarget(null);
      setSuspendReason("");
      loadCompanies();
    } catch (err: any) {
      toast.error(err?.message || t("superadmin_companies_action_failed"));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleActivate(company: CompanyWithRelations) {
    try {
      await activateCompany(company.id);
      toast.success(t("superadmin_companies_activated"));
      loadCompanies();
    } catch (err: any) {
      toast.error(err?.message || t("superadmin_companies_action_failed"));
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await deleteCompany(deleteTarget.id);
      toast.success(t("superadmin_companies_deleted"));
      setDeleteTarget(null);
      loadCompanies();
    } catch (err: any) {
      toast.error(err?.message || t("superadmin_companies_action_failed"));
    } finally {
      setActionLoading(false);
    }
  }

  const filtered = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.registration_number.toLowerCase().includes(search.toLowerCase()) ||
      (c.municipality_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
              {t("superadmin_nav_companies")}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              {t("superadmin_companies_subtitle")}
            </p>
          </div>
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
            {t("superadmin_companies_add")}
          </Button>
        </div>

        <div className="max-w-sm">
          <Input
            placeholder={t("superadmin_companies_search_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <DataTable<CompanyWithRelations>
          isLoading={loading}
          data={filtered}
          keyExtractor={(c) => c.id}
          emptyState={
            <div className="text-center py-14">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">{t("superadmin_companies_none_found")}</p>
            </div>
          }
          columns={[
            {
              key: "name",
              header: t("superadmin_companies_col_name"),
              render: (c) => (
                <div>
                  <p className="font-medium text-secondary-900 dark:text-white">{c.name}</p>
                  <p className="text-xs text-slate-400">{c.registration_number}</p>
                </div>
              ),
            },
            {
              key: "municipality_name",
              header: t("superadmin_companies_col_municipality"),
            },
            {
              key: "admin_name",
              header: t("superadmin_companies_col_admin"),
            },
            {
              key: "subscription_plan",
              header: t("superadmin_companies_col_plan"),
              render: (c) => (
                <Badge variant={planVariant[c.subscription_plan ?? "trial"]}>
                  {c.subscription_plan ?? "trial"}
                </Badge>
              ),
            },
            {
              key: "is_active",
              header: t("superadmin_companies_col_status"),
              render: (c) => (
                <Badge variant={c.is_active ? "success" : "error"} dot>
                  {c.is_active
                    ? t("superadmin_companies_status_active")
                    : t("superadmin_companies_status_suspended")}
                </Badge>
              ),
            },
            {
              key: "actions",
              header: "",
              render: (c) => (
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(c);
                    }}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                    title={t("superadmin_companies_edit")}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {c.is_active ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSuspendTarget(c);
                      }}
                      className="p-2 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                      title={t("superadmin_companies_suspend")}
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActivate(c);
                      }}
                      className="p-2 rounded-lg text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
                      title={t("superadmin_companies_activate")}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(c);
                    }}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title={t("superadmin_companies_delete")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? t("superadmin_companies_edit_title") : t("superadmin_companies_add_title")}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t("superadmin_companies_field_name")}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label={t("superadmin_companies_field_reg_number")}
              value={formData.registration_number}
              onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
              required
            />
          </div>

          <Select
            label={t("superadmin_companies_field_municipality")}
            placeholder={t("superadmin_companies_select_municipality")}
            value={formData.municipality_id}
            onChange={(e) => setFormData({ ...formData, municipality_id: e.target.value })}
            options={municipalities.map((m) => ({ value: m.id, label: m.name }))}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t("superadmin_companies_field_contact_person")}
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            />
            <Input
              label={t("superadmin_companies_field_phone")}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t("superadmin_companies_field_email")}
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label={t("superadmin_companies_field_billing_email")}
              type="email"
              value={formData.billing_email}
              onChange={(e) => setFormData({ ...formData, billing_email: e.target.value })}
            />
          </div>

          <Textarea
            label={t("superadmin_companies_field_address")}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            rows={2}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label={t("superadmin_companies_field_admin")}
              placeholder={t("superadmin_companies_select_admin")}
              value={formData.admin_id ?? ""}
              onChange={(e) => setFormData({ ...formData, admin_id: e.target.value })}
              options={admins.map((a) => ({
                value: a.id,
                label: `${a.first_name} ${a.last_name} (${a.email})`,
              }))}
            />
            <Select
              label={t("superadmin_companies_field_plan")}
              value={formData.subscription_plan}
              onChange={(e) =>
                setFormData({ ...formData, subscription_plan: e.target.value as CompanyFormInput["subscription_plan"] })
              }
              options={[
                { value: "trial", label: "Trial" },
                { value: "standard", label: "Standard" },
                { value: "professional", label: "Professional" },
                { value: "enterprise", label: "Enterprise" },
              ]}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              {t("superadmin_companies_cancel")}
            </Button>
            <Button onClick={handleSave} isLoading={isSaving}>
              {editingId ? t("superadmin_companies_save") : t("superadmin_companies_create")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* SUSPEND MODAL */}
      <Modal
        isOpen={!!suspendTarget}
        onClose={() => setSuspendTarget(null)}
        title={t("superadmin_companies_suspend_title")}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            {t("superadmin_companies_suspend_desc", { name: suspendTarget?.name })}
          </p>
          <Textarea
            label={t("superadmin_companies_suspend_reason_label")}
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setSuspendTarget(null)}>
              {t("superadmin_companies_cancel")}
            </Button>
            <Button variant="danger" onClick={handleSuspendConfirm} isLoading={actionLoading}>
              {t("superadmin_companies_suspend")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* DELETE CONFIRM */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={t("superadmin_companies_delete_title")}
        message={t("superadmin_companies_delete_desc", { name: deleteTarget?.name })}
        confirmText={t("superadmin_companies_delete")}
        cancelText={t("superadmin_companies_cancel")}
        variant="danger"
        isLoading={actionLoading}
      />
    </SuperAdminLayout>
  );
}