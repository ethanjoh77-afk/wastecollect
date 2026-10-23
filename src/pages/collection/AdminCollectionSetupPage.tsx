import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { DashboardLayout } from '../../components/layout';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Input, Modal, Select } from '../../components/common';
import { CompanyPicker } from '../../components/collection/CompanyPicker';
import { money } from '../../components/collection/PayStatusBadge';
import { useCollectionCompany } from '../../hooks/useCollectionCompany';
import {
  addCollector,
  listCollectors,
  listFeePlans,
  listWards,
  saveFeePlan,
  setCollectorActive,
  setCollectorWards,
} from '../../services/collectionService';
import { UNIT_TYPE_LABEL, type CollectorRow, type FeePlan, type UnitType, type Ward } from '../../types/collection.types';

const UNIT_OPTIONS = (Object.keys(UNIT_TYPE_LABEL) as UnitType[]).map((t) => ({ value: t, label: UNIT_TYPE_LABEL[t] }));

export default function AdminCollectionSetupPage() {
  const navigate = useNavigate();
  const { companies, companyId, setCompanyId, error: companyError } = useCollectionCompany();

  const [plans, setPlans] = useState<FeePlan[]>([]);
  const [collectors, setCollectors] = useState<CollectorRow[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [planModal, setPlanModal] = useState<Partial<FeePlan> | null>(null);
  const [collectorModal, setCollectorModal] = useState<{ email: string; wardIds: string[]; userId?: string; name?: string } | null>(null);

  const load = useCallback(async () => {
    if (!companyId) return;
    try {
      const [p, c, w] = await Promise.all([listFeePlans(companyId), listCollectors(companyId), listWards()]);
      setPlans(p);
      setCollectors(c);
      setWards(w);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  async function submitPlan() {
    if (!companyId || !planModal) return;
    if (!planModal.name?.trim() || !planModal.unit_type || planModal.amount === undefined || Number(planModal.amount) < 0) {
      toast.error('Jaza jina, aina na kiasi.');
      return;
    }
    try {
      await saveFeePlan({
        id: planModal.id,
        company_id: companyId,
        name: planModal.name,
        unit_type: planModal.unit_type,
        amount: Number(planModal.amount),
        is_active: planModal.is_active ?? true,
      });
      toast.success('Ada imehifadhiwa. Madeni ya miezi ijayo yatatumia kiasi kipya.');
      setPlanModal(null);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function submitCollector() {
    if (!companyId || !collectorModal) return;
    try {
      if (collectorModal.userId) {
        await setCollectorWards(collectorModal.userId, collectorModal.wardIds);
        toast.success('Maeneo yamebadilishwa.');
      } else {
        if (!collectorModal.email.trim()) return toast.error('Weka barua pepe ya mkusanyaji.');
        await addCollector(companyId, collectorModal.email.trim(), collectorModal.wardIds);
        toast.success('Mkusanyaji ameongezwa.');
      }
      setCollectorModal(null);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function toggleCollector(c: CollectorRow) {
    try {
      await setCollectorActive(c.user_id, !c.is_active);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const toggleWard = (id: string) =>
    setCollectorModal((m) =>
      m ? { ...m, wardIds: m.wardIds.includes(id) ? m.wardIds.filter((w) => w !== id) : [...m.wardIds, id] } : m
    );

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-3xl mx-auto">
        <button onClick={() => navigate('/collect/admin')} className="inline-flex items-center gap-1 text-sm text-secondary-500">
          <ArrowLeft className="w-4 h-4" /> Rudi
        </button>
        <h1 className="text-2xl font-bold">Mipangilio ya ukusanyaji</h1>
        <CompanyPicker companies={companies} value={companyId} onChange={setCompanyId} />
        {companyError && <p className="text-sm text-error-600">{companyError}</p>}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Ada kwa kichwa (kwa mwezi)</CardTitle>
              <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setPlanModal({ unit_type: 'family', amount: 10000, is_active: true })}>
                Ongeza
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {plans.length === 0 ? (
              <EmptyState title="Hakuna ada bado" description="Weka ada kwa kila aina ya kichwa (familia, mpangaji, mwenye nyumba, biashara) kabla ya kutengeneza madeni." />
            ) : (
              <ul className="divide-y divide-secondary-100 dark:divide-slate-700">
                {plans.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium">
                        {p.name} {!p.is_active && <Badge size="sm">Imezimwa</Badge>}
                      </p>
                      <p className="text-xs text-secondary-500">{UNIT_TYPE_LABEL[p.unit_type]}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{money(p.amount)}</span>
                      <button onClick={() => setPlanModal(p)} className="p-1.5 text-secondary-400 hover:text-primary-600" aria-label="Hariri">
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="px-4 py-3 text-xs text-secondary-500">
              Kila kichwa kinalipa ada moja bila kujali idadi ya watu au vyumba. Kichwa kipya kinapewa ada ya kwanza hai ya aina yake.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Wakusanyaji</CardTitle>
              <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setCollectorModal({ email: '', wardIds: [] })}>
                Ongeza
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {collectors.length === 0 ? (
              <EmptyState title="Hakuna wakusanyaji" description="Mkusanyaji ajisajili kwanza kwenye mfumo, kisha mwongeze hapa kwa barua pepe yake." />
            ) : (
              <ul className="divide-y divide-secondary-100 dark:divide-slate-700">
                {collectors.map((c) => (
                  <li key={c.user_id} className="px-4 py-3 text-sm space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">
                        {c.full_name} {!c.is_active && <Badge variant="error" size="sm">Imezimwa</Badge>}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setCollectorModal({ email: c.email, wardIds: c.ward_ids, userId: c.user_id, name: c.full_name })}>
                          Maeneo
                        </Button>
                        <Button size="sm" variant={c.is_active ? 'ghost' : 'outline'} onClick={() => toggleCollector(c)}>
                          {c.is_active ? 'Zima' : 'Washa'}
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-secondary-500">
                      {c.email}
                      {c.phone ? ` • ${c.phone}` : ''} •{' '}
                      {c.ward_ids.length === 0
                        ? 'Kata zote'
                        : wards.filter((w) => c.ward_ids.includes(w.id)).map((w) => w.name).join(', ')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal isOpen={!!planModal} onClose={() => setPlanModal(null)} title={planModal?.id ? 'Hariri ada' : 'Ada mpya'}>
        {planModal && (
          <div className="space-y-3">
            <Input label="Jina" value={planModal.name ?? ''} onChange={(e) => setPlanModal({ ...planModal, name: e.target.value })} placeholder="mf. Duka dogo" />
            <Select
              label="Aina ya kichwa"
              value={planModal.unit_type ?? 'family'}
              onChange={(e) => setPlanModal({ ...planModal, unit_type: e.target.value as UnitType })}
              options={UNIT_OPTIONS}
            />
            <Input
              label="Kiasi kwa mwezi (TZS)"
              type="number"
              min={0}
              value={planModal.amount ?? ''}
              onChange={(e) => setPlanModal({ ...planModal, amount: Number(e.target.value) })}
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={planModal.is_active ?? true} onChange={(e) => setPlanModal({ ...planModal, is_active: e.target.checked })} />
              Hai (inatumika)
            </label>
            <Button className="w-full" onClick={submitPlan}>
              Hifadhi
            </Button>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!collectorModal}
        onClose={() => setCollectorModal(null)}
        title={collectorModal?.userId ? `Maeneo ya ${collectorModal.name}` : 'Ongeza mkusanyaji'}
      >
        {collectorModal && (
          <div className="space-y-3">
            {!collectorModal.userId && (
              <Input
                label="Barua pepe ya mkusanyaji"
                type="email"
                value={collectorModal.email}
                onChange={(e) => setCollectorModal({ ...collectorModal, email: e.target.value })}
                hint="Lazima awe amejisajili kwenye mfumo tayari."
              />
            )}
            <div>
              <p className="text-sm font-medium mb-2">Kata atakazofanyia kazi (usichague zote = kata zote)</p>
              <div className="max-h-56 overflow-y-auto space-y-1 rounded-xl border border-secondary-200 dark:border-slate-700 p-2">
                {wards.map((w) => (
                  <label key={w.id} className="flex items-center gap-2 text-sm px-2 py-1">
                    <input type="checkbox" checked={collectorModal.wardIds.includes(w.id)} onChange={() => toggleWard(w.id)} />
                    {w.name}
                  </label>
                ))}
                {wards.length === 0 && <p className="text-xs text-secondary-500 p-2">Hakuna kata zilizopatikana.</p>}
              </div>
            </div>
            <Button className="w-full" onClick={submitCollector}>
              Hifadhi
            </Button>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
