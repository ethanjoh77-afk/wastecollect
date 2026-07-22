import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Users, Search, Eye, Ban, CheckCircle2, User as UserIcon, Truck, ShieldCheck, Building2 } from 'lucide-react';
import { SuperAdminLayout } from '../../components/layout/SuperAdminLayout';
import { DataTable } from '../../components/dashboard';
import { StatCard } from '../../components/dashboard';
import { Input, Select, Badge, Modal, Textarea, Button, EmptyState } from '../../components/common';
import {
  listUsers,
  getUserDetail,
  blockUser,
  restoreUser,
  getUserRoleCounts,
  type UserDetail,
} from '../../services/userManagementService';
import type { User, UserRole } from '../../types';

const PAGE_SIZE = 20;

const roleOptions: { value: UserRole | ''; label: string }[] = [
  { value: '', label: 'Majukumu yote' },
  { value: 'citizen', label: 'Wananchi' },
  { value: 'driver', label: 'Madereva' },
  { value: 'company_admin', label: 'Admin wa Kampuni' },
  { value: 'municipality_admin', label: 'Admin wa Manispaa' },
  { value: 'super_admin', label: 'Super Admin' },
];

const roleBadgeVariant: Record<UserRole, 'primary' | 'success' | 'warning' | 'error' | 'default'> = {
  citizen: 'default',
  driver: 'primary',
  company_admin: 'warning',
  municipality_admin: 'success',
  super_admin: 'error',
};

export default function UserManagementPage() {
  const { t } = useTranslation();

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [blockTarget, setBlockTarget] = useState<User | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    getUserRoleCounts().then(setRoleCounts).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, roleFilter, activeFilter]);

  async function load() {
    setLoading(true);
    try {
      const { users: rows, total: totalCount } = await listUsers({
        search,
        role: roleFilter,
        isActive: activeFilter,
        page,
        pageSize: PAGE_SIZE,
      });
      setUsers(rows);
      setTotal(totalCount);
    } catch (err) {
      console.error(err);
      toast.error('Imeshindikana kupakia watumiaji');
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load();
  }

  async function openDetail(user: User) {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const full = await getUserDetail(user.id);
      setDetail(full);
    } catch (err) {
      console.error(err);
      toast.error('Imeshindikana kupakia taarifa za mtumiaji');
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleBlockConfirm() {
    if (!blockTarget) return;
    setBusyId(blockTarget.id);
    try {
      await blockUser(blockTarget.id, blockReason || 'Haijaelezwa');
      toast.success(`${blockTarget.first_name} amezuiwa`);
      setBlockTarget(null);
      setBlockReason('');
      load();
    } catch (err: any) {
      toast.error(err?.message ?? 'Imeshindikana kuzuia mtumiaji');
    } finally {
      setBusyId(null);
    }
  }

  async function handleRestore(user: User) {
    setBusyId(user.id);
    try {
      await restoreUser(user.id);
      toast.success(`${user.first_name} amerejeshwa`);
      load();
    } catch (err: any) {
      toast.error(err?.message ?? 'Imeshindikana kurejesha mtumiaji');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-500" />
            {t('superadmin_nav_users')}
          </h1>
          <p className="text-sm text-secondary-500 dark:text-secondary-400">{total} watumiaji — data halisi kutoka database</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard title="Wananchi" value={roleCounts.citizen ?? '—'} icon={UserIcon} iconColor="bg-primary-500" />
          <StatCard title="Madereva" value={roleCounts.driver ?? '—'} icon={Truck} iconColor="bg-secondary-500" />
          <StatCard title="Admin Kampuni" value={roleCounts.company_admin ?? '—'} icon={Building2} iconColor="bg-warning-500" />
          <StatCard title="Admin Manispaa" value={roleCounts.municipality_admin ?? '—'} icon={ShieldCheck} iconColor="bg-success-500" />
          <StatCard title="Super Admin" value={roleCounts.super_admin ?? '—'} icon={ShieldCheck} iconColor="bg-error-500" />
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Tafuta kwa jina, barua pepe au simu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="w-full sm:w-56">
            <Select options={roleOptions} value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value as UserRole | ''); setPage(1); }} />
          </div>
          <div className="w-full sm:w-44">
            <Select
              options={[
                { value: 'all', label: 'Hali zote' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Blocked/Disabled' },
              ]}
              value={activeFilter}
              onChange={(e) => { setActiveFilter(e.target.value as any); setPage(1); }}
            />
          </div>
          <Button type="submit" variant="secondary">Tafuta</Button>
        </form>

        <DataTable<User>
          isLoading={loading}
          data={users}
          keyExtractor={(u) => u.id}
          emptyState={<EmptyState icon={Users} title="Hakuna watumiaji" description="Hakuna watumiaji wanaolingana na utafutaji wako." />}
          pagination={{ currentPage: page, totalPages, onPageChange: setPage }}
          columns={[
            {
              key: 'name',
              header: 'Jina',
              render: (u) => (
                <div>
                  <p className="font-medium text-secondary-900 dark:text-white">{u.first_name} {u.last_name}</p>
                  <p className="text-xs text-secondary-500">{u.email}</p>
                </div>
              ),
            },
            { key: 'role', header: 'Jukumu', render: (u) => <Badge variant={roleBadgeVariant[u.role]}>{u.role}</Badge> },
            { key: 'phone', header: 'Simu', render: (u) => u.phone ?? '—' },
            {
              key: 'is_active',
              header: 'Hali',
              render: (u) => (
                <Badge variant={u.is_active ? 'success' : 'error'} dot>
                  {u.is_active ? 'Active' : 'Blocked'}
                </Badge>
              ),
            },
            { key: 'created_at', header: 'Alijiunga', render: (u) => new Date(u.created_at).toLocaleDateString('sw-TZ') },
            {
              key: 'actions',
              header: '',
              render: (u) => (
                <div className="flex items-center gap-1 justify-end">
                  <button title="Ona" onClick={() => openDetail(u)} className="p-2 rounded-lg text-secondary-500 hover:bg-secondary-100 dark:hover:bg-slate-700">
                    <Eye className="w-4 h-4" />
                  </button>
                  {u.is_active ? (
                    <button
                      title="Zuia"
                      disabled={busyId === u.id}
                      onClick={() => setBlockTarget(u)}
                      className="p-2 rounded-lg text-warning-600 hover:bg-warning-50 dark:hover:bg-warning-900/20"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      title="Rejesha"
                      disabled={busyId === u.id}
                      onClick={() => handleRestore(u)}
                      className="p-2 rounded-lg text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* DETAIL MODAL */}
      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title={detail ? `${detail.first_name} ${detail.last_name}` : 'Taarifa za Mtumiaji'} size="lg">
        {detailLoading || !detail ? (
          <p className="text-secondary-500">Inapakia...</p>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Info label="Barua Pepe" value={detail.email} />
              <Info label="Simu" value={detail.phone ?? '—'} />
              <Info label="Jukumu" value={detail.role} />
              <Info label="Hali" value={detail.is_active ? 'Active' : 'Blocked'} />
              {detail.blocked_reason && <Info label="Sababu ya Kuzuiwa" value={detail.blocked_reason} />}
              <Info label="Alijiunga" value={new Date(detail.created_at).toLocaleDateString('sw-TZ')} />
            </div>

            {detail.citizenProfile && (
              <div className="pt-3 border-t border-secondary-100 dark:border-slate-700">
                <p className="font-semibold mb-2 text-secondary-900 dark:text-white">Wasifu wa Mwananchi</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Info label="Anwani" value={detail.citizenProfile.address ?? '—'} />
                  <Info label="Alama za Mazingira" value={String(detail.citizenProfile.eco_score)} />
                  <Info label="Pointi" value={String(detail.citizenProfile.reward_points)} />
                </div>
              </div>
            )}

            {detail.driverProfile && (
              <div className="pt-3 border-t border-secondary-100 dark:border-slate-700">
                <p className="font-semibold mb-2 text-secondary-900 dark:text-white">Wasifu wa Dereva</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Info label="Kampuni" value={detail.driverProfile.company_name ?? 'Hajapangiwa'} />
                  <Info label="Namba ya Leseni" value={detail.driverProfile.license_number ?? '—'} />
                  <Info label="Gari Alilopangiwa" value={detail.driverProfile.vehicle_registration ?? 'Hakuna'} />
                  <Info label="Alama" value={String(detail.driverProfile.rating ?? '—')} />
                  <Info label="Ukusanyaji Jumla" value={String(detail.driverProfile.total_collections)} />
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* BLOCK MODAL */}
      <Modal isOpen={!!blockTarget} onClose={() => setBlockTarget(null)} title={`Zuia ${blockTarget?.first_name ?? ''}`} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-secondary-500">Mtumiaji huyu hataweza kuingia kwenye mfumo. Eleza sababu:</p>
          <Textarea value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="Mfano: Ukiukaji wa masharti ya matumizi" />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setBlockTarget(null)}>Ghairi</Button>
            <Button variant="danger" isLoading={!!busyId} onClick={handleBlockConfirm}>Zuia</Button>
          </div>
        </div>
      </Modal>
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
