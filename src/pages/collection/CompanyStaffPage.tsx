import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { DashboardLayout } from '../../components/layout';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Input, Modal, Select } from '../../components/common';
import { CompanyPicker } from '../../components/collection/CompanyPicker';
import { useCollectionCompany } from '../../hooks/useCollectionCompany';
import {
  createCompanyStaff,
  listCompanyStaff,
  listWards,
  setStaffActive,
  type StaffRow,
} from '../../services/collectionService';
import type { Ward } from '../../types/collection.types';

const EMPTY = {
  role: 'driver' as 'driver' | 'collector',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
  license_number: '',
  employee_id: '',
  ward_ids: [] as string[],
};

const ROLE_LABEL: Record<string, string> = { driver: 'Dereva', collector: 'Mkusanyaji' };

/** Admin wa kampuni anasajili na kusimamia madereva/wakusanyaji wa kampuni yake. */
export default function CompanyStaffPage() {
  const navigate = useNavigate();
  const { companies, companyId, setCompanyId, error: companyError } = useCollectionCompany();
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [form, setForm] = useState<typeof EMPTY | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!companyId) return;
    try {
      const [s, w] = await Promise.all([listCompanyStaff(companyId), listWards()]);
      setStaff(s);
      setWards(w);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit() {
    if (!companyId || !form) return;
    if (!form.first_name.trim() || !form.email.trim() || form.password.length < 8) {
      toast.error('Jaza jina, barua pepe na nenosiri (angalau herufi 8).');
      return;
    }
    setSaving(true);
    try {
      await createCompanyStaff({
        company_id: companyId,
        role: form.role,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        license_number: form.license_number.trim() || undefined,
        employee_id: form.employee_id.trim() || undefined,
        ward_ids: form.role === 'collector' ? form.ward_ids : undefined,
      });
      toast.success(`${ROLE_LABEL[form.role]} amesajiliwa. Mpe barua pepe na nenosiri lake.`);
      setForm(null);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function toggle(s: StaffRow) {
    try {
      await setStaffActive(s.user_id, !s.is_active);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const toggleWard = (id: string) =>
    setForm((f) =>
      f ? { ...f, ward_ids: f.ward_ids.includes(id) ? f.ward_ids.filter((w) => w !== id) : [...f.ward_ids, id] } : f
    );

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-3xl mx-auto">
        <button onClick={() => navigate('/collect/admin')} className="inline-flex items-center gap-1 text-sm text-secondary-500">
          <ArrowLeft className="w-4 h-4" /> Rudi
        </button>
        <h1 className="text-2xl font-bold">Wafanyakazi wa kampuni</h1>
        <p className="text-sm text-secondary-500">
          Madereva na wakusanyaji husajiliwa na kampuni yako pekee. Hawawezi kujisajili wenyewe kwenye mfumo.
        </p>
        <CompanyPicker companies={companies} value={companyId} onChange={setCompanyId} />
        {companyError && <p className="text-sm text-error-600">{companyError}</p>}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Madereva na wakusanyaji ({staff.length})</CardTitle>
              <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setForm({ ...EMPTY })}>
                Sajili
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {staff.length === 0 ? (
              <EmptyState title="Hakuna wafanyakazi bado" description="Bonyeza 'Sajili' kumwongeza dereva au mkusanyaji wa kwanza." />
            ) : (
              <ul className="divide-y divide-secondary-100 dark:divide-slate-700">
                {staff.map((s) => (
                  <li key={s.user_id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {s.full_name}{' '}
                        <Badge size="sm">{ROLE_LABEL[s.role] ?? s.role}</Badge>{' '}
                        {!s.is_active && <Badge variant="error" size="sm">Imezimwa</Badge>}
                      </p>
                      <p className="text-xs text-secondary-500 truncate">
                        {s.email}
                        {s.phone ? ` • ${s.phone}` : ''}
                        {s.license_number ? ` • leseni ${s.license_number}` : ''}
                      </p>
                    </div>
                    <Button size="sm" variant={s.is_active ? 'ghost' : 'outline'} onClick={() => toggle(s)}>
                      {s.is_active ? 'Zima' : 'Washa'}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal isOpen={!!form} onClose={() => setForm(null)} title="Sajili mfanyakazi">
        {form && (
          <div className="space-y-3">
            <Select
              label="Aina"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as 'driver' | 'collector' })}
              options={[
                { value: 'driver', label: 'Dereva' },
                { value: 'collector', label: 'Mkusanyaji (ada za kaya)' },
              ]}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Jina la kwanza" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              <Input label="Jina la mwisho" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </div>
            <Input label="Barua pepe" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Simu" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input
              label="Nenosiri la kuanzia"
              type="text"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              hint="Angalau herufi 8. Mpe mfanyakazi, aibadili baadaye."
            />
            {form.role === 'driver' && (
              <div className="grid grid-cols-2 gap-3">
                <Input label="Namba ya leseni (hiari)" value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} />
                <Input label="Namba ya mfanyakazi (hiari)" value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} />
              </div>
            )}
            {form.role === 'collector' && (
              <div>
                <p className="text-sm font-medium mb-2">Kata atakazofanyia kazi (usichague = kata zote za kampuni)</p>
                <div className="max-h-44 overflow-y-auto space-y-1 rounded-xl border border-secondary-200 dark:border-slate-700 p-2">
                  {wards.map((w) => (
                    <label key={w.id} className="flex items-center gap-2 text-sm px-2 py-1">
                      <input type="checkbox" checked={form.ward_ids.includes(w.id)} onChange={() => toggleWard(w.id)} />
                      {w.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <Button className="w-full" isLoading={saving} onClick={submit}>
              Sajili
            </Button>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
