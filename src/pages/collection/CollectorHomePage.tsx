import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ScanLine, Search, Map as MapIcon, PlusCircle, Wallet, LayoutDashboard, Receipt as ReceiptIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { DashboardLayout } from '../../components/layout';
import { Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Input } from '../../components/common';
import { OfflineBanner } from '../../components/collection/OfflineBanner';
import { CompanyPicker } from '../../components/collection/CompanyPicker';
import { QrScanner, isScannerSupported } from '../../components/collection/QrScanner';
import { money } from '../../components/collection/PayStatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { useCollectionCompany } from '../../hooks/useCollectionCompany';
import { getMyPaymentsToday, normalizeCode } from '../../services/collectionService';
import { PAY_METHOD_LABEL, type UnitPayment } from '../../types/collection.types';

export default function CollectorHomePage() {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { companies, companyId, setCompanyId, loading, error } = useCollectionCompany();
  const [code, setCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [today, setToday] = useState<UnitPayment[]>([]);

  const isAdmin = hasRole(['company_admin', 'super_admin']);

  useEffect(() => {
    if (!user) return;
    getMyPaymentsToday(user.id)
      .then(setToday)
      .catch(() => undefined); // offline: acha tupu
  }, [user]);

  const totals = useMemo(() => {
    const ok = today.filter((p) => p.status === 'completed');
    return {
      count: ok.length,
      all: ok.reduce((s, p) => s + p.amount, 0),
      cash: ok.filter((p) => p.method === 'cash').reduce((s, p) => s + p.amount, 0),
    };
  }, [today]);

  const openCode = useCallback(
    (raw: string) => {
      const c = normalizeCode(raw);
      if (!c) return;
      setScanning(false);
      navigate(`/collect/unit/${encodeURIComponent(c)}`);
    },
    [navigate]
  );

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">Ukusanyaji wa ada</h1>
          <p className="text-sm text-secondary-500">Scan au andika code ya kaya ili kuona deni na kupokea malipo.</p>
        </div>

        <CompanyPicker companies={companies} value={companyId} onChange={setCompanyId} />
        {error && !loading && (
          <div className="rounded-xl bg-error-50 dark:bg-error-900/20 border border-error-200 p-4 text-sm text-error-700 dark:text-error-300">
            {error}
          </div>
        )}

        <OfflineBanner />

        <Card>
          <CardContent className="p-4 space-y-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                openCode(code);
              }}
              className="flex gap-2 items-end"
            >
              <div className="flex-1">
                <Input
                  label="Code ya kaya"
                  placeholder="WC-000123-4"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoCapitalize="characters"
                  autoComplete="off"
                />
              </div>
              <Button type="submit" leftIcon={<Search className="w-4 h-4" />} disabled={!code.trim()}>
                Tafuta
              </Button>
            </form>
            <Button
              variant="outline"
              className="w-full"
              leftIcon={<ScanLine className="w-5 h-5" />}
              onClick={() =>
                isScannerSupported()
                  ? setScanning(true)
                  : toast('Kamera ya kuscan haipatikani hapa. Andika code kwa mkono.', { icon: 'ℹ️' })
              }
            >
              Scan QR
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-secondary-500">Leo</p>
              <p className="text-base font-bold">{money(totals.all)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-secondary-500">Taslimu</p>
              <p className="text-base font-bold">{money(totals.cash)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-secondary-500">Malipo</p>
              <p className="text-base font-bold">{totals.count}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ActionTile to="/collect/map" icon={MapIcon} label="Ramani ya kaya" />
          <ActionTile to="/collect/register" icon={PlusCircle} label="Sajili nyumba" />
          <ActionTile to="/collect/shift" icon={Wallet} label="Funga siku" />
          {isAdmin && <ActionTile to="/collect/admin" icon={LayoutDashboard} label="Dashibodi ya admin" />}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Malipo niliyopokea leo</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {today.length === 0 ? (
              <EmptyState icon={ReceiptIcon} title="Bado hakuna malipo leo" />
            ) : (
              <ul className="divide-y divide-secondary-100 dark:divide-slate-700">
                {today.slice(0, 15).map((p) => (
                  <li key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium">{p.receipt_no}</p>
                      <p className="text-xs text-secondary-500">
                        {PAY_METHOD_LABEL[p.method]} • {new Date(p.created_at).toLocaleTimeString('sw-TZ', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <p className={p.status === 'reversed' ? 'line-through text-secondary-400' : 'font-semibold'}>
                      {money(p.amount)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <QrScanner isOpen={scanning} onClose={() => setScanning(false)} onDetected={openCode} />
    </DashboardLayout>
  );
}

function ActionTile({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-secondary-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-card active:scale-[0.98] transition"
    >
      <Icon className="w-7 h-7 text-primary-500" />
      <span className="text-sm font-medium text-center">{label}</span>
    </Link>
  );
}
