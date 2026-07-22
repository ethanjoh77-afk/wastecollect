import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Plus, UserCog, Ban, CheckCircle2, Trash2 } from "lucide-react";
import { SuperAdminLayout } from "../../components/layout/SuperAdminLayout";
import { DataTable } from "../../components/dashboard";
import { Button, Input, Select, Modal, ConfirmDialog, Badge } from "../../components/common";
import {
  getAdmins,
  createAdmin,
  updateAdminStatus,
  deleteAdmin,
  getUnassignedCompanies,
  getUnassignedMunicipalities,
  type AdminWithRelations,
  type CreateAdminInput,
} from "../../services/adminManagementService";

const emptyForm: CreateAdminInput = {
  email: "",
  password: "",
  first_name: "",
  last_name: "",
  phone: "",
  role: "company_admin",
  company_id: "",
  municipality_id: "",
};

export default function AdminManagementPage() {
  const { t } = useTranslation();

  const [admins, setAdmins] = useState<AdminWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [municipalities, setMunicipalities] = useState<{ id: string; name: string }[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreateAdminInput>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminWithRelations | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadAdmins() {
    setLoading(true);
    try {
      setAdmins(await getAdmins());
    } catch (err) {
      console.error(err);
      toast.error(t("superadmin_admins_load_failed"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdmins();
  }, []);

  async function openCreateModal() {
    setFormData(emptyForm);
    setIsModalOpen(true);
    try {
      const [c, m] = await Promise.all([getUnassignedCompanies(), getUnassignedMunicipalities()]);
      setCompanies(c);
      setMunicipalities(m);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCreate() {
    if (!formData.email || !formData.password || !formData.first_name || !formData.last_name) {
      toast.error(t("superadmin_admins_required_fields"));
      return;
    }
    if (formData.password.length < 8) {
      toast.error(t("superadmin_admins_password_hint"));
      return;
    }

    setIsSaving(true);
    try {
      await createAdmin(formData);
      toast.success(t("superadmin_admins_created"));
      setIsModalOpen(false);
      loadAdmins();
    } catch (err: any) {
      toast.error(err?.message || t("superadmin_admins_save_failed"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleActive(admin: AdminWithRelations) {
    try {
      await updateAdminStatus(admin.id, !admin.is_active);
      toast.success(
        admin.is_active ? t("superadmin_admins_deactivated") : t("superadmin_admins_activated")
      );
      loadAdmins();
    } catch (err: any) {
      toast.error(err?.message || t("superadmin_admins_action_failed"));
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await deleteAdmin(deleteTarget.id);
      toast.success(t("superadmin_admins_deleted"));
      setDeleteTarget(null);
      loadAdmins();
    } catch (err: any) {
      toast.error(err?.message || t("superadmin_admins_action_failed"));
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
              {t("superadmin_nav_admins")}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">{t("superadmin_admins_subtitle")}</p>
          </div>
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
            {t("superadmin_admins_add")}
          </Button>
        </div>

        <DataTable<AdminWithRelations>
          isLoading={loading}
          data={admins}
          keyExtractor={(a) => a.id}
          emptyState={
            <div className="text-center py-14">
              <UserCog className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">{t("superadmin_admins_none_found")}</p>
            </div>
          }
          columns={[
            {
              key: "first_name",
              header: t("superadmin_admins_col_name"),
              render: (a) => (
                <div>
                  <p className="font-medium text-secondary-900 dark:text-white">
                    {a.first_name} {a.last_name}
                  </p>
                  <p className="text-xs text-slate-400">{a.email}</p>
                </div>
              ),
            },
            {
              key: "role",
              header: t("superadmin_admins_col_role"),
              render: (a) => (
                <Badge variant={a.role === "company_admin" ? "primary" : "info"}>
                  {a.role === "company_admin"
                    ? t("register_role_company_admin", "Company Admin")
                    : t("register_role_municipality_admin", "Municipality Admin")}
                </Badge>
              ),
            },
            {
              key: "company_name",
              header: t("superadmin_admins_col_assigned"),
              render: (a) => a.company_name || a.municipality_name || "—",
            },
            {
              key: "is_active",
              header: t("superadmin_companies_col_status"),
              render: (a) => (
                <Badge variant={a.is_active ? "success" : "error"} dot>
                  {a.is_active
                    ? t("superadmin_companies_status_active")
                    : t("superadmin_admins_status_inactive")}
                </Badge>
              ),
            },
            {
              key: "actions",
              header: "",
              render: (a) => (
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleActive(a);
                    }}
                    className={
                      a.is_active
                        ? "p-2 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                        : "p-2 rounded-lg text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
                    }
                    title={a.is_active ? t("superadmin_admins_deactivate") : t("superadmin_companies_activate")}
                  >
                    {a.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(a);
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t("superadmin_admins_add_title")}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t("register_first_name")}
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              required
            />
            <Input
              label={t("register_last_name")}
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              required
            />
          </div>

          <Input
            label={t("register_email")}
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t("register_phone")}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label={t("superadmin_admins_field_temp_password")}
              type="text"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              hint={t("superadmin_admins_password_hint")}
              required
            />
          </div>

          <Select
            label={t("superadmin_admins_field_role")}
            value={formData.role}
            onChange={(e) =>
              setFormData({
                ...formData,
                role: e.target.value as CreateAdminInput["role"],
                company_id: "",
                municipality_id: "",
              })
            }
            options={[
              { value: "company_admin", label: "Company Admin" },
              { value: "municipality_admin", label: "Municipality Admin" },
            ]}
          />

          {formData.role === "company_admin" ? (
            <Select
              label={t("superadmin_companies_field_municipality").replace(
                "Manispaa",
                "Kampuni"
              )}
              placeholder={t("superadmin_admins_select_company")}
              value={formData.company_id}
              onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
              options={companies.map((c) => ({ value: c.id, label: c.name }))}
              hint={companies.length === 0 ? t("superadmin_admins_no_unassigned_companies") : undefined}
            />
          ) : (
            <Select
              label={t("superadmin_companies_field_municipality")}
              placeholder={t("superadmin_admins_select_municipality")}
              value={formData.municipality_id}
              onChange={(e) => setFormData({ ...formData, municipality_id: e.target.value })}
              options={municipalities.map((m) => ({ value: m.id, label: m.name }))}
              hint={
                municipalities.length === 0 ? t("superadmin_admins_no_unassigned_municipalities") : undefined
              }
            />
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              {t("superadmin_companies_cancel")}
            </Button>
            <Button onClick={handleCreate} isLoading={isSaving}>
              {t("superadmin_admins_create")}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={t("superadmin_admins_delete_title")}
        message={t("superadmin_admins_delete_desc", { name: deleteTarget?.first_name })}
        confirmText={t("superadmin_companies_delete")}
        cancelText={t("superadmin_companies_cancel")}
        variant="danger"
        isLoading={actionLoading}
      />
    </SuperAdminLayout>
  );
}