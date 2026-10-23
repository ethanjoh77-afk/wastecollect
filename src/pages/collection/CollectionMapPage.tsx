import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { DashboardLayout } from '../../components/layout';
import { Button, EmptyState } from '../../components/common';
import { PropertiesMap } from '../../components/collection/PropertiesMap';
import { money } from '../../components/collection/PayStatusBadge';
import { listPropertyMap } from '../../services/collectionService';
import { PAY_STATUS_LABEL, type MapStatus, type PropertyMapRow } from '../../types/collection.types';

const FILTERS: { key: MapStatus | 'all'; label: string; dot: string }[] = [
  { key: 'all', label: 'Zote', dot: 'bg-secondary-400' },
  { key: 'unpaid', label: PAY_STATUS_LABEL.unpaid, dot: 'bg-red-500' },
  { key: 'partial', label: PAY_STATUS_LABEL.partial, dot: 'bg-yellow-400' },
  { key: 'paid', label: PAY_STATUS_LABEL.paid, dot: 'bg-green-500' },
  { key: 'vacant', label: PAY_STATUS_LABEL.vacant, dot: 'bg-gray-500' },
];

export default function CollectionMapPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<PropertyMapRow[]>([]);
  const [filter, setFilter] = useState<MapStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setRows(await listPropertyMap());
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length, unpaid: 0, partial: 0, paid: 0, vacant: 0 };
    rows.forEach((r) => (c[r.map_status] += 1));
    return c;
  }, [rows]);

  const visible = useMemo(() => (filter === 'all' ? rows : rows.filter((r) => r.map_status === filter)), [rows, filter]);
  const totalDebt = useMemo(() => visible.reduce((s, r) => s + r.total_debt, 0), [visible]);

  return (
    <DashboardLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <button onClick={() => navigate('/collect')} className="inline-flex items-center gap-1 text-sm text-secondary-500">
            <ArrowLeft className="w-4 h-4" /> Rudi
          </button>
          <Button variant="ghost" size="sm" onClick={load} leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}>
            Sasisha
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
                filter === f.key
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-secondary-200 dark:border-slate-700'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${f.dot}`} />
              {f.label} ({counts[f.key] ?? 0})
            </button>
          ))}
        </div>

        <p className="text-sm text-secondary-600 dark:text-secondary-300">
          Nyumba zinazoonyeshwa: <b>{visible.length}</b> • Deni lote: <b className="text-error-600">{money(totalDebt)}</b>
        </p>

        {!loading && rows.length === 0 ? (
          <EmptyState
            title="Hakuna nyumba zenye GPS bado"
            description="Sajili nyumba ukiwa mtaani (GPS inachukuliwa wakati wa usajili) ili zionekane kwenye ramani."
            action={<Button onClick={() => navigate('/collect/register')}>Sajili nyumba</Button>}
          />
        ) : (
          <PropertiesMap properties={visible} height="68vh" />
        )}
      </div>
    </DashboardLayout>
  );
}
