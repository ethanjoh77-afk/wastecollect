import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Truck, Plus, Search, Eye, UserPlus, UserMinus, Trash2, Wrench } from 'lucide-react';
import { SuperAdminLayout } from '../../components/layout/SuperAdminLayout';
import { DataTable } from '../../components/dashboard';
import { Button, Input, Select, StatusBadge, Modal, ConfirmDialog, EmptyState } from '../../components/common';
import {
  listVehicles,
  getVehicleDetail,
  createVehicle,
  setVehicleStatus,
  deleteVehicle,
  listAvailableDrivers,
  assignDriverToVehicle,
  unassignDriver,
  type VehicleWithDetails,
  type VehicleDetail,
} from '../../services/fleetManagementService';
import { listCompaniesForSelect } from '../../services/companySelectService';
import type { VehicleStatus } from '../../types';

const PAGE_SIZE = 20;

const emptyForm = { company_id: '', registration_number: '', vehicle_type: '', capacity_kg: '', fuel_type: '' };

export default function FleetManagementPage() {
  const { t } = useTranslation();

  const [vehicles, setVehicles] = useState<VehicleWithDetails[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | ''>('');
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<VehicleDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState<{ user_id: string; name: string }[]>([]);

  const [deleteTarget, setDeleteTarget] = useState<VehicleWithDetails | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    listCompaniesForSelect().then(setCompanies).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  async function load() {
    setLoading(true);
    try {
      const { vehicles: rows, total: totalCount } = await listVehicles({ search, status: statusFilter, page, pageSize: PAGE_SIZE });
      setVehicles(rows);
      setTotal(totalCount);
    } catch (err) {
      console.error(err);
      toast.error('Imeshindikana kupakia magari');
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.company_id || !form.registration_number) {
      toast.error('Chagua kampuni na weka namba ya usajili');
      return;
    }
    setSaving(true);
    try {
      await createVehicle({
        company_id: form.company_id,
        registration_number: form.registration_number,
        vehicle_type: form.vehicle_type || undefined,
        capacity_kg: form.capacity_kg ? Number(form.capacity_kg) : undefined,
        fuel_type: form.fuel_type || undefined,
      });
      toast.success('Gari limeongezwa');
      setFormOpen(false);
      setForm(emptyForm);
      load();
    } catch (err: any) {
      toast.error(err?.message ?? 'Imeshindikana kuongeza gari');
    } finally {
      setSaving(false);
    }
  }

  async function openDetail(vehicle: VehicleWithDetails) {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const [full, drivers] = await Promise.all([
        getVehicleDetail(vehicle.id),
        listAvailableDrivers(vehicle.company_id),
      ]);
      setDetail(full);
      setAvailableDrivers(drivers);
    } catch (err) {
      console.error(err);
      toast.error('Imeshindikana kupakia taarifa za gari');
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleSetStatus(vehicle: VehicleWithDetails, status: VehicleStatus) {
    setBusyId(vehicle.id);
    try {
      await setVehicleStatus(vehicle.id, status);
      toast.success('Hali ya gari imesasishwa');
      load();
      if (detail?.id === vehicle.id) setDetail({ ...detail, status });
    } catch (err: any) {
      toast.error(err?.message ?? 'Imeshindwa');
    } finally {
      setBusyId(null);
    }
  }

  async function handleAssignDriver(vehicleId: string, driverUserId: string) {
    if (!driverUserId) return;
    setBusyId(vehicleId);
    try {
      await assignDriverToVehicle(vehicleId, driverUserId);
      toast.success('Dereva amepangwa');
      load();
      if (detail?.id === vehicleId) openDetail(detail);
    } catch (err: any) {
      toast.error(err?.message ?? 'Imeshindwa kupanga dereva');
    } finally {
      setBusyId(null);
    }
  }

  async function handleUnassignDriver(vehicle: VehicleWithDetails) {
    setBusyId(vehicle.id);
    try {
      await unassignDriver(vehicle.id, vehicle.driver_id);
      toast.success('Dereva ameondolewa kwenye gari');
      load();
      if (detail?.id === vehicle.id) openDetail(vehicle);
    } catch (err: any) {
      toast.error(err?.message ?? 'Imeshindwa');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await deleteVehicle(deleteTarget.id);
      toast.success('Gari limefutwa');
      setDeleteTarget(null);
      load();
    } catch (err: any) {
      toast.error(err?.message ?? 'Imeshindwa kufuta gari');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-white flex items-center gap-2">
              <Truck className="w-6 h-6 text-amber-500" />
              {t('superadmin_nav_fleet')}
            </h1>
            <p className="text-sm text-secondary-500 dark:text-secondary-400">{total} magari — data halisi kutoka database</p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4" /> Ongeza Gari
          </Button>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input placeholder="Tafuta kwa namba ya usajili..." value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="w-4 h-4" />} />
          </div>
          <div className="w-full sm:w-56">
            <Select
              options={[
                { value: '', label: 'Hali zote' },
                { value: 'available', label: 'Available' },
                { value: 'on_route', label: 'On Route' },
                { value: 'maintenance', label: 'Maintenance' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as VehicleStatus | ''); setPage(1); }}
            />
          </div>
          <Button type="submit" variant="secondary">Tafuta</Button>
        </form>

        <DataTable<VehicleWithDetails>
          isLoading={loading}
          data={vehicles}
          keyExtractor={(v) => v.id}
          emptyState={<EmptyState icon={Truck} title="Hakuna magari" description="Hakuna magari yanayolingana na utafutaji wako." />}
          pagination={{ currentPage: page, totalPages, onPageChange: setPage }}
          columns={[
            {
              key: 'registration_number',
              header: 'Gari',
              render: (v) => (
                <div>
                  <p className="font-medium text-secondary-900 dark:text-white">{v.registration_number}</p>
                  <p className="text-xs text-secondary-500">{v.vehicle_type ?? '—'}</p>
                </div>
              ),
            },
            { key: 'company_name', header: 'Kampuni', render: (v) => v.company_name ?? '—' },
            { key: 'driver_name', header: 'Dereva', render: (v) => v.driver_name ?? <span className="text-secondary-400">Hajapangiwa</span> },
            { key: 'status', header: 'Hali', render: (v) => <StatusBadge status={v.status} /> },
            {
              key: 'actions',
              header: '',
              render: (v) => (
                <div className="flex items-center gap-1 justify-end">
                  <button title="Ona" onClick={() => openDetail(v)} className="p-2 rounded-lg text-secondary-500 hover:bg-secondary-100 dark:hover:bg-slate-700">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    title="Weka Matengenezo"
                    disabled={busyId === v.id}
                    onClick={() => handleSetStatus(v, v.status === 'maintenance' ? 'available' : 'maintenance')}
                    className="p-2 rounded-lg text-warning-600 hover:bg-warning-50 dark:hover:bg-warning-900/20"
                  >
                    <Wrench className="w-4 h-4" />
                  </button>
                  {v.driver_id ? (
                    <button title="Ondoa Dereva" disabled={busyId === v.id} onClick={() => handleUnassignDriver(v)} className="p-2 rounded-lg text-secondary-500 hover:bg-secondary-100 dark:hover:bg-slate-700">
                      <UserMinus className="w-4 h-4" />
                    </button>
                  ) : (
                    <button title="Ona ili Umpangie Dereva" onClick={() => openDetail(v)} className="p-2 rounded-lg text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20">
                      <UserPlus className="w-4 h-4" />
                    </button>
                  )}
                  <button title="Futa" disabled={busyId === v.id} onClick={() => setDeleteTarget(v)} className="p-2 rounded-lg text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* CREATE MODAL */}
      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title="Ongeza Gari Jipya" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <Select
            label="Kampuni"
            placeholder="Chagua kampuni"
            value={form.company_id}
            onChange={(e) => setForm({ ...form, company_id: e.target.value })}
            options={companies.map((c) => ({ value: c.id, label: c.name }))}
            required
          />
          <Input label="Namba ya Usajili" value={form.registration_number} onChange={(e) => setForm({ ...form, registration_number: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Aina ya Gari" value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })} placeholder="Mfano: Truck" />
            <Input label="Uzito (kg)" type="number" value={form.capacity_kg} onChange={(e) => setForm({ ...form, capacity_kg: e.target.value })} />
          </div>
          <Input label="Aina ya Mafuta" value={form.fuel_type} onChange={(e) => setForm({ ...form, fuel_type: e.target.value })} placeholder="Mfano: Diesel" />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>Ghairi</Button>
            <Button type="submit" isLoading={saving}>Ongeza Gari</Button>
          </div>
        </form>
      </Modal>

      {/* DETAIL MODAL */}
      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title={detail?.registration_number ?? 'Taarifa za Gari'} size="lg">
        {detailLoading || !detail ? (
          <p className="text-secondary-500">Inapakia...</p>
        ) : (
          <div className="space-y-5 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Info label="Kampuni" value={detail.company_name ?? '—'} />
              <Info label="Aina" value={detail.vehicle_type ?? '—'} />
              <Info label="Uzito" value={detail.capacity_kg ? `${detail.capacity_kg} kg` : '—'} />
              <Info label="Mafuta" value={detail.fuel_type ?? '—'} />
              <Info label="Eneo la Mwisho" value={detail.last_location_update ? new Date(detail.last_location_update).toLocaleString('sw-TZ') : 'Hakuna GPS bado'} />
            </div>

            <div className="pt-3 border-t border-secondary-100 dark:border-slate-700">
              <p className="font-semibold mb-2 text-secondary-900 dark:text-white">Dereva</p>
              {detail.driver_name ? (
                <div className="flex items-center justify-between">
                  <span>{detail.driver_name}</span>
                  <Button size="sm" variant="secondary" onClick={() => handleUnassignDriver(detail)}>Ondoa</Button>
                </div>
              ) : availableDrivers.length > 0 ? (
                <select
                  className="w-full border border-secondary-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-sm"
                  defaultValue=""
                  onChange={(e) => handleAssignDriver(detail.id, e.target.value)}
                >
                  <option value="" disabled>Mpangie dereva...</option>
                  {availableDrivers.map((d) => (
                    <option key={d.user_id} value={d.user_id}>{d.name}</option>
                  ))}
                </select>
              ) : (
                <p className="text-secondary-400">Hakuna dereva huru wa kampuni hii kwa sasa</p>
              )}
            </div>

            <div className="pt-3 border-t border-secondary-100 dark:border-slate-700">
              <p className="font-semibold mb-2 text-secondary-900 dark:text-white">Historia ya Njia (10 za Karibuni)</p>
              {detail.recentRoutes.length === 0 ? (
                <p className="text-secondary-400">Hakuna njia zilizorekodiwa bado kwa gari hili</p>
              ) : (
                <ul className="space-y-1">
                  {detail.recentRoutes.map((r) => (
                    <li key={r.id} className="flex items-center justify-between text-xs">
                      <span>{r.name ?? r.id.slice(0, 8)}</span>
                      <StatusBadge status={r.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Futa Gari"
        message={`Una uhakika unataka kufuta gari "${deleteTarget?.registration_number}"? Hatua hii haiwezi kutenduliwa.`}
        confirmText="Futa"
        cancelText="Ghairi"
        isLoading={!!busyId}
      />
    </SuperAdminLayout>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-secondary-500">{label}</p>
      <p className="font-medium text-secondary-900 dark:text-white">{value}</p>
    </div>
  );
}
