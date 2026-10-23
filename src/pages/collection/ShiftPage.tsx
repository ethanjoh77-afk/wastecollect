import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { DashboardLayout } from '../../components/layout';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from '../../components/common';
import { money } from '../../components/collection/PayStatusBadge';
import { OfflineBanner } from '../../components/collection/OfflineBanner';
import { useAuth } from '../../hooks/useAuth';
import { getMyPaymentsToday, getMyShifts, submitShift } from '../../services/collectionService';
import type { ShiftRow, UnitPayment } from '../../types/collection.types';

const STATUS_LABEL: Record<ShiftRow['status'], { text: string; variant: 'success' | 'warning' | 'error' | 'default' }> = {
  open: { text: 'Wazi', variant: 'default' },
  submitted: { text: 'Imewasilishwa', variant: 'default' },
  discrepancy: { text: 'Kuna tofauti', variant: 'error' },
  confirmed: { text: 'Imethibitishwa', variant: 'success' },
};

export default function ShiftPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [payments, setPayments] = useState<UnitPayment[]>([]);
  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [declared, setDeclared] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!user) return;
    try {
      const [p, s] = await Promise.all([getMyPaymentsToday(user.id), getMyShifts(user.id)]);
      setPayments(p);
      setShifts(s);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const cash = useMemo(
    () => payments.filter((p) => p.status === 'completed' && p.method === 'cash').reduce((s, p) => s + p.amount, 0),
    [payments]
  );
  const other = useMemo(
    () => payments.filter((p) => p.status === 'completed' && p.method !== 'cash').reduce((s, p) => s + p.amount, 0),
    [payments]
  );

  async function handleSubmit() {
    const value = Number(declared);
    if (declared === '' || Number.isNaN(value) || value < 0) {
      toast.error('Weka kiasi cha taslimu unachowasilisha.');
      return;
    }
    setSaving(true);
    try {
      const s = await submitShift(value, notes);
      if (s.status === 'discrepancy') {
        toast.error(`Kuna tofauti ya ${money(Math.abs(s.expected_cash - value))}. Msimamizi ataiona.`);
      } else {
        toast.success('Siku imefungwa. Asante!');
      }
      setDeclared('');
      setNotes('');
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 max-w-2xl mx-auto">
        <button onClick={() => navigate('/collect')} className="inline-flex items-center gap-1 text-sm text-secondary-500">
          <ArrowLeft className="w-4 h-4" /> Rudi
        </button>
        <OfflineBanner />

        <Card>
          <CardHeader>
            <CardTitle>Funga siku</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl bg-secondary-50 dark:bg-slate-900 p-3">
                <p className="text-xs text-secondary-500">Taslimu kwenye mfumo</p>
                <p className="text-xl font-bold">{money(cash)}</p>
              </div>
              <div className="rounded-xl bg-secondary-50 dark:bg-slate-900 p-3">
                <p className="text-xs text-secondary-500">Simu/benki (si taslimu)</p>
                <p className="text-xl font-bold">{money(other)}</p>
              </div>
            </div>
            <Input
              label="Taslimu unayowasilisha (TZS)"
              type="number"
              inputMode="numeric"
              value={declared}
              onChange={(e) => setDeclared(e.target.value)}
              hint="Hesabu pesa taslimu ulizo nazo, kisha weka kiasi halisi."
            />
            <Input label="Maelezo (hiari)" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <Button className="w-full" isLoading={saving} onClick={handleSubmit}>
              Wasilisha na funga siku
            </Button>
            <p className="text-xs text-secondary-500">
              Malipo ya offline ambayo bado hayajatumwa hayajahesabiwa. Hakikisha yametumwa kabla ya kufunga.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Siku zangu za karibuni</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-secondary-100 dark:divide-slate-700">
              {shifts.length === 0 && <li className="p-4 text-sm text-secondary-500">Bado hujafunga siku yoyote.</li>}
              {shifts.map((s) => (
                <li key={s.id} className="px-4 py-3 text-sm flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{s.shift_date}</p>
                    <p className="text-xs text-secondary-500">
                      Mfumo {money(s.expected_cash)} • Uliwasilisha {money(s.declared_cash)}
                    </p>
                  </div>
                  <Badge variant={STATUS_LABEL[s.status].variant}>{STATUS_LABEL[s.status].text}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
