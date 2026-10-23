import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, UserPlus, LogOut, Undo2, Banknote } from 'lucide-react';
import toast from 'react-hot-toast';
import { DashboardLayout } from '../../components/layout';
import { Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Input, Modal, Select } from '../../components/common';
import { OfflineBanner } from '../../components/collection/OfflineBanner';
import { PayStatusBadge, money } from '../../components/collection/PayStatusBadge';
import { Receipt } from '../../components/collection/Receipt';
import { useAuth } from '../../hooks/useAuth';
import { newClientUuid } from '../../lib/offlineQueue';
import {
  addOccupant,
  getUnitByCode,
  getUnitOccupants,
  getUnitPayments,
  moveOutOccupant,
  recordPaymentOrQueue,
  reversePayment,
} from '../../services/collectionService';
import {
  PAY_METHOD_LABEL,
  UNIT_TYPE_LABEL,
  type OccupantBalance,
  type PayMethod,
  type PaymentReceipt,
  type UnitPayment,
  type UnitStatusRow,
} from '../../types/collection.types';

const METHOD_OPTIONS = (Object.keys(PAY_METHOD_LABEL) as PayMethod[]).map((m) => ({
  value: m,
  label: PAY_METHOD_LABEL[m],
}));

export default function UnitPaymentPage() {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isAdmin = hasRole(['company_admin', 'super_admin']);

  const [unit, setUnit] = useState<UnitStatusRow | null>(null);
  const [payments, setPayments] = useState<UnitPayment[]>([]);
  const [occupants, setOccupants] = useState<OccupantBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PayMethod>('cash');
  const [ref, setRef] = useState('');
  const [paying, setPaying] = useState(false);
  const [paymentKey, setPaymentKey] = useState(newClientUuid());
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);

  const [showAddOccupant, setShowAddOccupant] = useState(false);
  const [occ, setOcc] = useState({ name: '', phone: '', size: '' });
  const [reverseFor, setReverseFor] = useState<UnitPayment | null>(null);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const u = await getUnitByCode(code);
      if (!u) {
        setNotFound(true);
        setUnit(null);
        return;
      }
      setUnit(u);
      setAmount(u.balance && u.balance > 0 ? String(u.balance) : '');
      const [p, o] = await Promise.all([getUnitPayments(u.billing_unit_id), getUnitOccupants(u.billing_unit_id)]);
      setPayments(p);
      setOccupants(o);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePay() {
    if (!unit) return;
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error('Weka kiasi sahihi.');
      return;
    }
    setPaying(true);
    try {
      const r = await recordPaymentOrQueue({
        code: unit.code,
        amount: value,
        method,
        ref: ref.trim() || null,
        payerName: unit.full_name ?? '',
        balanceBefore: unit.balance,
        clientUuid: paymentKey,
      });
      setReceipt(r);
      setPaymentKey(newClientUuid()); // malipo yanayofuata ni mapya
      setRef('');
    } catch (e) {
      toast.error((e as Error).message || 'Imeshindikana kupokea malipo.');
    } finally {
      setPaying(false);
    }
  }

  async function handleAddOccupant() {
    if (!unit || !occ.name.trim()) {
      toast.error('Weka jina la mkazi.');
      return;
    }
    try {
      await addOccupant({
        unitId: unit.billing_unit_id,
        fullName: occ.name.trim(),
        phone: occ.phone.trim(),
        householdSize: occ.size ? Number(occ.size) : null,
      });
      toast.success('Mkazi ameongezwa. Madeni yataanza mwezi unaofuata.');
      setShowAddOccupant(false);
      setOcc({ name: '', phone: '', size: '' });
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleMoveOut() {
    if (!unit?.occupant_id) return;
    if (!window.confirm(`Mtoe ${unit.full_name}? Deni lake (${money(unit.balance)}) litabaki kwake.`)) return;
    try {
      await moveOutOccupant(unit.occupant_id);
      toast.success('Mkazi ametolewa. Kichwa sasa kiko wazi.');
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleReverse() {
    if (!reverseFor) return;
    try {
      await reversePayment(reverseFor.id, reason.trim());
      toast.success('Malipo yamerekebishwa.');
      setReverseFor(null);
      setReason('');
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const formerDebts = occupants.filter((o) => !o.is_current && o.balance > 0);

  return (
    <DashboardLayout>
      <div className="space-y-4 max-w-2xl mx-auto">
        <button onClick={() => navigate('/collect')} className="inline-flex items-center gap-1 text-sm text-secondary-500">
          <ArrowLeft className="w-4 h-4" /> Rudi
        </button>

        <OfflineBanner />

        {loading ? (
          <div className="py-16 text-center text-secondary-500">Inapakia…</div>
        ) : notFound || !unit ? (
          <EmptyState
            variant="not-found"
            title="Code haijapatikana"
            description={`"${code}" haipo, au haipo kwenye eneo lako la kazi. Hakikisha umeandika vizuri.`}
          />
        ) : (
          <>
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm text-secondary-500">{unit.code}</p>
                    <h1 className="text-xl font-bold">{unit.full_name ?? 'Kichwa kiko wazi'}</h1>
                    <p className="text-sm text-secondary-500">
                      {UNIT_TYPE_LABEL[unit.unit_type]}
                      {unit.label ? ` • ${unit.label}` : ''}
                      {unit.address ? ` • ${unit.address}` : ''}
                    </p>
                    {unit.phone && (
                      <a href={`tel:${unit.phone}`} className="text-sm text-primary-600">
                        {unit.phone}
                      </a>
                    )}
                  </div>
                  <PayStatusBadge status={unit.pay_status} />
                </div>

                {unit.pay_status !== 'vacant' && (
                  <div className="rounded-xl bg-secondary-50 dark:bg-slate-900 p-4 text-center">
                    <p className="text-xs text-secondary-500">Deni la sasa</p>
                    <p className={`text-3xl font-bold ${(unit.balance ?? 0) > 0 ? 'text-error-600' : 'text-success-600'}`}>
                      {money(Math.max(unit.balance ?? 0, 0))}
                    </p>
                    {(unit.balance ?? 0) < 0 && (
                      <p className="text-xs text-success-600">Ana salio la {money(Math.abs(unit.balance ?? 0))}</p>
                    )}
                  </div>
                )}

                {unit.pay_status !== 'vacant' && (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleMoveOut} leftIcon={<LogOut className="w-4 h-4" />}>
                      Amehama
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {unit.pay_status === 'vacant' ? (
              <Card>
                <CardContent className="p-5 space-y-3">
                  <p className="text-sm text-secondary-600 dark:text-secondary-300">
                    Kichwa hiki kiko wazi, hakizalishi deni. Mpangaji/mkazi mpya akiingia, mwongeze hapa.
                  </p>
                  <Button onClick={() => setShowAddOccupant(true)} leftIcon={<UserPlus className="w-4 h-4" />}>
                    Ongeza mkazi mpya
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Pokea malipo</CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  <Input
                    label="Kiasi (TZS)"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <Select
                    label="Njia ya malipo"
                    value={method}
                    onChange={(e) => setMethod(e.target.value as PayMethod)}
                    options={METHOD_OPTIONS}
                  />
                  {method !== 'cash' && (
                    <Input
                      label="Namba ya muamala (hiari)"
                      value={ref}
                      onChange={(e) => setRef(e.target.value)}
                      placeholder="mf. QWE123ABC"
                    />
                  )}
                  <Button className="w-full" size="lg" isLoading={paying} onClick={handlePay} leftIcon={<Banknote className="w-5 h-5" />}>
                    Pokea {amount ? money(Number(amount)) : ''}
                  </Button>
                </CardContent>
              </Card>
            )}

            {formerDebts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Madeni ya wakazi waliohama</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="divide-y divide-secondary-100 dark:divide-slate-700">
                    {formerDebts.map((o) => (
                      <li key={o.occupant_id} className="px-4 py-3 text-sm flex justify-between">
                        <span>
                          {o.full_name}
                          <span className="block text-xs text-secondary-500">Alihama {o.moved_out}</span>
                        </span>
                        <span className="font-semibold text-error-600">{money(o.balance)}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Malipo ya karibuni</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {payments.length === 0 ? (
                  <EmptyState title="Hakuna malipo bado" />
                ) : (
                  <ul className="divide-y divide-secondary-100 dark:divide-slate-700">
                    {payments.map((p) => (
                      <li key={p.id} className="px-4 py-3 text-sm flex items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{p.receipt_no}</p>
                          <p className="text-xs text-secondary-500">
                            {PAY_METHOD_LABEL[p.method]} • {new Date(p.created_at).toLocaleDateString('sw-TZ')}
                            {p.status === 'reversed' && ` • Imerekebishwa: ${p.reversal_reason ?? ''}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={p.status === 'reversed' ? 'line-through text-secondary-400' : 'font-semibold'}>
                            {money(p.amount)}
                          </span>
                          {isAdmin && p.status === 'completed' && (
                            <button
                              title="Rekebisha malipo"
                              onClick={() => setReverseFor(p)}
                              className="p-1.5 rounded-lg text-secondary-400 hover:text-error-600 hover:bg-secondary-100 dark:hover:bg-slate-700"
                            >
                              <Undo2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Modal
        isOpen={!!receipt}
        onClose={() => {
          setReceipt(null);
          load();
        }}
        title="Risiti"
        showClose={false}
      >
        {receipt && (
          <Receipt
            receipt={receipt}
            onDone={() => {
              setReceipt(null);
              navigate('/collect');
            }}
          />
        )}
      </Modal>

      <Modal isOpen={showAddOccupant} onClose={() => setShowAddOccupant(false)} title="Mkazi mpya">
        <div className="space-y-3">
          <Input label="Jina kamili" value={occ.name} onChange={(e) => setOcc({ ...occ, name: e.target.value })} />
          <Input label="Simu (hiari)" type="tel" value={occ.phone} onChange={(e) => setOcc({ ...occ, phone: e.target.value })} />
          <Input
            label="Idadi ya watu (hiari)"
            type="number"
            min={1}
            value={occ.size}
            onChange={(e) => setOcc({ ...occ, size: e.target.value })}
          />
          <Button className="w-full" onClick={handleAddOccupant}>
            Hifadhi
          </Button>
        </div>
      </Modal>

      <Modal isOpen={!!reverseFor} onClose={() => setReverseFor(null)} title="Rekebisha malipo">
        <div className="space-y-3">
          <p className="text-sm text-secondary-600 dark:text-secondary-300">
            Risiti {reverseFor?.receipt_no} ({money(reverseFor?.amount)}) itafutwa kwenye mapato na deni litarudi. Sababu ni lazima.
          </p>
          <Input label="Sababu" value={reason} onChange={(e) => setReason(e.target.value)} />
          <Button variant="danger" className="w-full" disabled={reason.trim().length < 3} onClick={handleReverse}>
            Rekebisha
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
