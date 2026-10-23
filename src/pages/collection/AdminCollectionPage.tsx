import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Map as MapIcon, Settings2, PlayCircle, CheckCircle2, RefreshCw, PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { DashboardLayout } from '../../components/layout';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Select } from '../../components/common';
import { CompanyPicker } from '../../components/collection/CompanyPicker';
import { money } from '../../components/collection/PayStatusBadge';
import { useCollectionCompany } from '../../hooks/useCollectionCompany';
import {
  confirmShift,
  generateCharges,
  getAreaSummary,
  listCollectors,
  listDebtors,
  listShifts,
  listWards,
} from '../../services/collectionService';
import type { AreaSummaryRow, CollectorRow, DebtorRow, ShiftRow, Ward } from '../../types/collection.types';

export default function AdminCollectionPage() {
  const { companies, companyId, setCompanyId, loading: companyLoading, error: companyError } = useCollectionCompany();

  const [areas, setAreas] = useState<AreaSummaryRow[]>([]);
  const [debtors, setDebtors] = useState<DebtorRow[]>([]);
  const [collectors, setCollectors] = useState<CollectorRow[]>([]);
  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [wardFilter, setWardFilter] = useState('');
  const [debtTab, setDebtTab] = useState<'all' | 'former'>('all');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [a, d, c, s, w] = await Promise.all([
        getAreaSummary(companyId),
        listDebtors(companyId, { wardId: wardFilter || undefined, onlyFormer: debtTab === 'former', limit: 100 }),
        listCollectors(companyId),
        listShifts(companyId, 14),
        listWards(),
      ]);
      setAreas(a);
      setDebtors(d);
      setCollectors(c);
      setShifts(s);
      setWards(w);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [companyId, wardFilter, debtTab]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => {
    const billed = areas.reduce((s, a) => s + a.billed_this_month, 0);
    const collected = areas.reduce((s, a) => s + a.collected_this_month, 0);
    const outstanding = areas.reduce((s, a) => s + a.outstanding_total, 0);
    const units = areas.reduce((s, a) => s + a.active_units, 0);
    return { billed, collected, outstanding, units, rate: billed > 0 ? Math.min((collected / billed) * 100, 999) : 0 };
  }, [areas]);

  async function handleGenerate() {
    if (!companyId) return;
    if (!window.confirm('Tengeneza madeni ya mwezi huu kwa kila kichwa chenye mkazi? (Haidoubliki ukirudia.)')) return;
    setGenerating(true);
    try {
      const r = await generateCharges(companyId);
      toast.success(`Madeni ${r.charges_created} yametengenezwa.`);
      if (r.units_without_fee_plan > 0) {
        toast(`Vichwa ${r.units_without_fee_plan} havina ada — weka ada kwenye Mipangilio.`, { icon: '⚠️' });
      }
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleConfirm(id: string) {
    try {
      await confirmShift(id);
      toast.success('Imethibitishwa.');
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const pendingShifts = shifts.filter((s) => s.status === 'submitted' || s.status === 'discrepancy');

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Dashibodi ya ukusanyaji</h1>
            <p className="text-sm text-secondary-500">Mapato, madeni na utendaji wa wakusanyaji.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/collect/register">
              <Button variant="outline" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>Sajili nyumba</Button>
            </Link>
            <Link to="/collect/map">
              <Button variant="outline" size="sm" leftIcon={<MapIcon className="w-4 h-4" />}>Ramani</Button>
            </Link>
            <Link to="/collect/admin/setup">
              <Button variant="outline" size="sm" leftIcon={<Settings2 className="w-4 h-4" />}>Mipangilio</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={load} leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}>
              Sasisha
            </Button>
          </div>
        </div>

        <CompanyPicker companies={companies} value={companyId} onChange={setCompanyId} />
        {companyError && !companyLoading && <p className="text-sm text-error-600">{companyError}</p>}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Kpi label="Madeni ya mwezi huu" value={money(totals.billed)} />
          <Kpi label="Yaliyokusanywa mwezi huu" value={money(totals.collected)} tone="success" />
          <Kpi label="Deni lote lililobaki" value={money(totals.outstanding)} tone="error" />
          <Kpi label="Kiwango cha ukusanyaji" value={`${totals.rate.toFixed(0)}%`} sub={`Vichwa hai: ${totals.units}`} />
        </div>

        <Card>
          <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-secondary-600 dark:text-secondary-300">
              Mwanzo wa kila mwezi, tengeneza madeni ya vichwa vyote vyenye wakazi. Ni salama kurudia.
            </p>
            <Button onClick={handleGenerate} isLoading={generating} leftIcon={<PlayCircle className="w-4 h-4" />}>
              Tengeneza madeni ya mwezi
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kwa kata</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {areas.length === 0 ? (
              <EmptyState title="Bado hakuna data" description="Sajili nyumba na tengeneza madeni ili uone muhtasari." />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-secondary-500 border-b border-secondary-100 dark:border-slate-700">
                    <th className="p-3">Kata</th>
                    <th className="p-3 text-right">Vichwa</th>
                    <th className="p-3 text-right">Madeni (mwezi)</th>
                    <th className="p-3 text-right">Yamekusanywa</th>
                    <th className="p-3 text-right">Yamebaki (jumla)</th>
                    <th className="p-3 w-32">Kiwango</th>
                  </tr>
                </thead>
                <tbody>
                  {areas.map((a) => {
                    const rate = a.billed_this_month > 0 ? Math.min((a.collected_this_month / a.billed_this_month) * 100, 100) : 0;
                    return (
                      <tr key={a.ward_id ?? 'none'} className="border-b border-secondary-50 dark:border-slate-700/60">
                        <td className="p-3 font-medium">{a.ward_name ?? '—'}</td>
                        <td className="p-3 text-right">{a.active_units}</td>
                        <td className="p-3 text-right">{money(a.billed_this_month)}</td>
                        <td className="p-3 text-right text-success-600">{money(a.collected_this_month)}</td>
                        <td className="p-3 text-right text-error-600">{money(a.outstanding_total)}</td>
                        <td className="p-3">
                          <div className="h-2 rounded-full bg-secondary-100 dark:bg-slate-700 overflow-hidden">
                            <div className="h-full bg-primary-500" style={{ width: `${rate}%` }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Wadaiwa</CardTitle>
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-lg border border-secondary-200 dark:border-slate-700 overflow-hidden text-xs">
                  {(['all', 'former'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setDebtTab(t)}
                      className={`px-3 py-1.5 ${debtTab === t ? 'bg-primary-500 text-white' : ''}`}
                    >
                      {t === 'all' ? 'Wote' : 'Waliohama'}
                    </button>
                  ))}
                </div>
                <div className="w-40">
                  <Select
                    value={wardFilter}
                    onChange={(e) => setWardFilter(e.target.value)}
                    options={[{ value: '', label: 'Kata zote' }, ...wards.map((w) => ({ value: w.id, label: w.name }))]}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {debtors.length === 0 ? (
              <EmptyState title="Hakuna wadaiwa" />
            ) : (
              <ul className="divide-y divide-secondary-100 dark:divide-slate-700">
                {debtors.map((d) => (
                  <li key={d.occupant_id}>
                    <Link to={`/collect/unit/${d.code}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-secondary-50 dark:hover:bg-slate-700/40">
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {d.full_name} {!d.is_current && <Badge variant="default" size="sm">Amehama</Badge>}
                        </p>
                        <p className="text-xs text-secondary-500 truncate">
                          <span className="font-mono">{d.code}</span> • {d.ward_name ?? '—'}
                          {d.address ? ` • ${d.address}` : ''}
                          {d.phone ? ` • ${d.phone}` : ''}
                        </p>
                      </div>
                      <p className="font-semibold text-error-600 shrink-0">{money(d.balance)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wakusanyaji</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {collectors.length === 0 ? (
              <EmptyState title="Hakuna wakusanyaji" description="Ongeza wakusanyaji kwenye Mipangilio." />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-secondary-500 border-b border-secondary-100 dark:border-slate-700">
                    <th className="p-3">Jina</th>
                    <th className="p-3 text-right">Mwezi huu</th>
                    <th className="p-3 text-right">Malipo</th>
                    <th className="p-3 text-right">Taslimu leo</th>
                    <th className="p-3 text-right">Nyumba alizosajili</th>
                  </tr>
                </thead>
                <tbody>
                  {collectors.map((c) => (
                    <tr key={c.user_id} className="border-b border-secondary-50 dark:border-slate-700/60">
                      <td className="p-3 font-medium">
                        {c.full_name} {!c.is_active && <Badge variant="error" size="sm">Imezimwa</Badge>}
                      </td>
                      <td className="p-3 text-right">{money(c.collected_this_month)}</td>
                      <td className="p-3 text-right">{c.payments_this_month}</td>
                      <td className="p-3 text-right">{money(c.cash_today)}</td>
                      <td className="p-3 text-right">{c.properties_registered}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Siku zilizofungwa (siku 14)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {shifts.length === 0 ? (
              <EmptyState title="Hakuna siku zilizofungwa bado" />
            ) : (
              <ul className="divide-y divide-secondary-100 dark:divide-slate-700">
                {shifts.map((s) => {
                  const diff = (s.declared_cash ?? 0) - s.expected_cash;
                  return (
                    <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium">
                          {s.collector_name} • {s.shift_date}
                        </p>
                        <p className="text-xs text-secondary-500">
                          Mfumo {money(s.expected_cash)} • Aliwasilisha {money(s.declared_cash)}
                          {diff !== 0 && <span className="text-error-600"> • tofauti {money(diff)}</span>}
                        </p>
                      </div>
                      {s.status === 'confirmed' ? (
                        <Badge variant="success" dot>Imethibitishwa</Badge>
                      ) : pendingShifts.includes(s) ? (
                        <Button size="sm" variant={s.status === 'discrepancy' ? 'danger' : 'primary'} leftIcon={<CheckCircle2 className="w-4 h-4" />} onClick={() => handleConfirm(s.id)}>
                          Thibitisha
                        </Button>
                      ) : (
                        <Badge>Wazi</Badge>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'success' | 'error' }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-secondary-500">{label}</p>
        <p className={`text-xl font-bold mt-1 ${tone === 'success' ? 'text-success-600' : tone === 'error' ? 'text-error-600' : ''}`}>{value}</p>
        {sub && <p className="text-xs text-secondary-500 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}
