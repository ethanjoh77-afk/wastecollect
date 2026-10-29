import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Crosshair, Plus, Trash2, CheckCircle2, CloudOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { DashboardLayout } from '../../components/layout';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Select } from '../../components/common';
import { OfflineBanner } from '../../components/collection/OfflineBanner';
import { CompanyPicker } from '../../components/collection/CompanyPicker';
import { StickerSheet } from '../../components/collection/StickerSheet';
import { useAuth } from '../../hooks/useAuth';
import { useCollectionCompany } from '../../hooks/useCollectionCompany';
import { newClientUuid } from '../../lib/offlineQueue';
import {
  getMyWardIds,
  listFeePlans,
  listStreets,
  listWards,
  registerPropertyOrQueue,
} from '../../services/collectionService';
import {
  PROPERTY_TYPE_LABEL,
  type FeePlan,
  type PropertyType,
  type RegisterPropertyResult,
  type RegisterUnitInput,
  type Street,
  type Ward,
} from '../../types/collection.types';

interface DraftUnit {
  key: string;
  label: string;
  name: string;
  phone: string;
  size: string;
  vacant: boolean;
  feePlanId: string;
  debt: string;
  paid: string;
}

const emptyUnit = (label = ''): DraftUnit => ({
  key: newClientUuid(),
  label,
  name: '',
  phone: '',
  size: '',
  vacant: false,
  feePlanId: '',
  debt: '',
  paid: '',
});

const WARDS_CACHE = 'wc_wards_cache';
const streetsCacheKey = (wardId: string) => `wc_streets_cache_${wardId}`;

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export default function RegisterPropertyPage() {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { companies, companyId, setCompanyId, loading: companyLoading, error: companyError } = useCollectionCompany();

  const clientUuid = useRef(newClientUuid());

  const [wards, setWards] = useState<Ward[]>([]);
  const [streets, setStreets] = useState<Street[]>([]);
  const [feePlans, setFeePlans] = useState<FeePlan[]>([]);

  const [wardId, setWardId] = useState('');
  const [streetId, setStreetId] = useState('');
  const [type, setType] = useState<PropertyType>('family');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [totalRooms, setTotalRooms] = useState('');
  const [familySize, setFamilySize] = useState('');
  const [ownerDebt, setOwnerDebt] = useState('');
  const [ownerPaid, setOwnerPaid] = useState('');

  const [gps, setGps] = useState<{ lat: number; lng: number; accuracy: number | null } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const [tenants, setTenants] = useState<DraftUnit[]>([emptyUnit('Chumba 1')]);
  const [landlordUses, setLandlordUses] = useState(false);
  const [businesses, setBusinesses] = useState<DraftUnit[]>([emptyUnit('')]);

  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<RegisterPropertyResult | null>(null);
  const [queued, setQueued] = useState(false);

  /* ---------- kata (zimehifadhiwa kwa offline) ---------- */
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [all, mine] = await Promise.all([
          listWards(),
          user.role === 'collector' ? getMyWardIds(user.id) : Promise.resolve([] as string[]),
        ]);
        const list = mine.length > 0 ? all.filter((w) => mine.includes(w.id)) : all;
        localStorage.setItem(WARDS_CACHE, JSON.stringify(list));
        setWards(list);
        if (list.length === 1) setWardId(list[0].id);
      } catch {
        const cached = readCache<Ward[]>(WARDS_CACHE) ?? [];
        setWards(cached);
        if (cached.length === 1) setWardId(cached[0].id);
      }
    })();
  }, [user]);

  useEffect(() => {
    setStreetId('');
    if (!wardId) {
      setStreets([]);
      return;
    }
    listStreets(wardId)
      .then((s) => {
        localStorage.setItem(streetsCacheKey(wardId), JSON.stringify(s));
        setStreets(s);
      })
      .catch(() => setStreets(readCache<Street[]>(streetsCacheKey(wardId)) ?? []));
  }, [wardId]);

  useEffect(() => {
    if (!companyId) return;
    listFeePlans(companyId)
      .then((p) => setFeePlans(p.filter((x) => x.is_active)))
      .catch(() => setFeePlans([]));
  }, [companyId]);

  const businessPlans = feePlans.filter((p) => p.unit_type === 'business');

  /* ---------- GPS ---------- */
  function captureGps() {
    if (!('geolocation' in navigator)) {
      toast.error('Kifaa hiki hakina GPS.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy ?? null });
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
        toast.error('Imeshindikana kupata eneo. Washa GPS na ruhusu eneo kwenye kivinjari.');
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }

  /* ---------- hesabu ya vichwa ---------- */
  const headCount = useMemo(() => {
    if (type === 'family') return 1;
    if (type === 'multi_tenant') return tenants.filter((t) => !t.vacant).length + (landlordUses ? 1 : 0);
    return businesses.length;
  }, [type, tenants, landlordUses, businesses]);

  const opening = (debt: string, paid: string) => {
    const d = Number(debt) || 0;
    const p = Number(paid) || 0;
    return d > 0 || p > 0 ? { debt: d, paid: p } : null;
  };

  function buildUnits(): RegisterUnitInput[] | string {
    const occupant = (name: string, phone: string, size: string) =>
      name.trim()
        ? { full_name: name.trim(), phone: phone.trim(), household_size: size ? Number(size) : null }
        : null;

    if (type === 'family') {
      if (!ownerName.trim()) return 'Weka jina la mkuu wa kaya.';
      return [
        {
          unit_type: 'family',
          label: 'Nyumba',
          occupant: occupant(ownerName, ownerPhone, familySize),
          opening: opening(ownerDebt, ownerPaid),
        },
      ];
    }

    if (type === 'multi_tenant') {
      const units: RegisterUnitInput[] = [];
      for (const [i, t] of tenants.entries()) {
        if (!t.vacant && !t.name.trim()) return `Weka jina la mpangaji wa "${t.label || `chumba ${i + 1}`}" au weka kama wazi.`;
        units.push({
          unit_type: 'tenant',
          label: t.label.trim() || `Chumba ${i + 1}`,
          occupant: t.vacant ? null : occupant(t.name, t.phone, t.size),
          opening: t.vacant ? null : opening(t.debt, t.paid),
        });
      }
      if (landlordUses) {
        if (!ownerName.trim()) return 'Weka jina la mwenye nyumba.';
        units.push({
          unit_type: 'landlord',
          label: 'Vyumba vya mwenye nyumba',
          occupant: occupant(ownerName, ownerPhone, familySize),
          opening: opening(ownerDebt, ownerPaid),
        });
      }
      if (units.length === 0) return 'Ongeza angalau chumba kimoja.';
      return units;
    }

    const units: RegisterUnitInput[] = [];
    for (const [i, b] of businesses.entries()) {
      if (!b.label.trim()) return `Weka jina la biashara #${i + 1}.`;
      units.push({
        unit_type: 'business',
        label: b.label.trim(),
        fee_plan_id: b.feePlanId || null,
        occupant: occupant(b.name || b.label, b.phone, ''),
        opening: opening(b.debt, b.paid),
      });
    }
    return units;
  }

  async function handleSubmit() {
    if (!companyId) return toast.error('Kampuni haijapatikana.');
    if (!wardId) return toast.error('Chagua kata.');
    const units = buildUnits();
    if (typeof units === 'string') return toast.error(units);
    if (!gps && !window.confirm('Hujachukua GPS — nyumba haitaonekana kwenye ramani. Endelea bila GPS?')) return;

    setSaving(true);
    try {
      const res = await registerPropertyOrQueue({
        client_uuid: clientUuid.current,
        company_id: companyId,
        ward_id: wardId,
        street_id: streetId || null,
        property_type: type,
        owner_name: ownerName,
        owner_phone: ownerPhone,
        total_rooms: totalRooms ? Number(totalRooms) : null,
        address,
        lat: gps?.lat ?? null,
        lng: gps?.lng ?? null,
        units,
      });
      if (res) {
        setResult(res);
        toast.success('Nyumba imesajiliwa.');
      } else {
        setQueued(true);
        toast('Hakuna mtandao — usajili umehifadhiwa na utatumwa baadaye.', { icon: '📴' });
      }
    } catch (e) {
      toast.error((e as Error).message || 'Imeshindikana kusajili.');
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    clientUuid.current = newClientUuid();
    setResult(null);
    setQueued(false);
    setOwnerName('');
    setOwnerPhone('');
    setAddress('');
    setTotalRooms('');
    setFamilySize('');
    setOwnerDebt('');
    setOwnerPaid('');
    setGps(null);
    setTenants([emptyUnit('Chumba 1')]);
    setBusinesses([emptyUnit('')]);
    setLandlordUses(false);
  }

  const canPickAnyCompany = hasRole(['super_admin']);

  /* ================================ MATOKEO ================================ */
  if (result || queued) {
    return (
      <DashboardLayout>
        <div className="space-y-4 max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-6 text-center space-y-2">
              {queued ? (
                <CloudOff className="w-12 h-12 mx-auto text-warning-500" />
              ) : (
                <CheckCircle2 className="w-12 h-12 mx-auto text-success-500" />
              )}
              <h2 className="text-lg font-semibold">{queued ? 'Imehifadhiwa offline' : 'Usajili umekamilika'}</h2>
              <p className="text-sm text-secondary-500">
                {queued
                  ? 'Code za kaya zitatolewa baada ya usajili kutumwa mtandao ukirudi. Utaziona kwenye ramani na orodha ya nyumba.'
                  : 'Chapisha sticker hizi na ubandike mlangoni kwa kila kichwa.'}
              </p>
            </CardContent>
          </Card>

          {result && <StickerSheet units={result.units} ownerName={ownerName} />}

          <div className="flex flex-wrap gap-2 justify-center print:hidden">
            {result && (
              <Button variant="outline" onClick={() => navigate(`/collect/property/${result.property_id}`)}>
                Fungua nyumba
              </Button>
            )}
            <Button onClick={resetForm}>Sajili nyumba nyingine</Button>
            <Button variant="ghost" onClick={() => navigate('/collect')}>
              Nyumbani
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  /* ================================== FOMU ================================= */
  return (
    <DashboardLayout>
      <div className="space-y-4 max-w-2xl mx-auto">
        <button onClick={() => navigate('/collect')} className="inline-flex items-center gap-1 text-sm text-secondary-500">
          <ArrowLeft className="w-4 h-4" /> Rudi
        </button>
        <h1 className="text-2xl font-bold">Sajili nyumba</h1>
        <OfflineBanner />
        {canPickAnyCompany && <CompanyPicker companies={companies} value={companyId} onChange={setCompanyId} />}
        {companyError && !companyLoading && <p className="text-sm text-error-600">{companyError}</p>}

        <Card>
          <CardHeader>
            <CardTitle>1. Mahali</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            <Select
              label="Kata"
              value={wardId}
              onChange={(e) => setWardId(e.target.value)}
              placeholder="Chagua kata"
              options={wards.map((w) => ({ value: w.id, label: w.name }))}
            />
            {streets.length > 0 && (
              <Select
                label="Mtaa (hiari)"
                value={streetId}
                onChange={(e) => setStreetId(e.target.value)}
                placeholder="Chagua mtaa"
                options={streets.map((s) => ({ value: s.id, label: s.name }))}
              />
            )}
            <Input
              label="Maelezo ya mahali (hiari)"
              placeholder="mf. karibu na duka la Mama Neema"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <div className="rounded-xl bg-secondary-50 dark:bg-slate-900 p-3 flex items-center justify-between gap-3">
              <div className="text-sm">
                {gps ? (
                  <>
                    <p className="font-medium text-success-600">GPS imepatikana</p>
                    <p className="text-xs text-secondary-500">
                      {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}
                      {gps.accuracy !== null && ` • usahihi ±${Math.round(gps.accuracy)}m`}
                    </p>
                  </>
                ) : (
                  <p className="text-secondary-600 dark:text-secondary-300">Simama mlangoni mwa nyumba kisha bonyeza kitufe.</p>
                )}
              </div>
              <Button size="sm" variant={gps ? 'outline' : 'primary'} isLoading={gpsLoading} onClick={captureGps} leftIcon={<Crosshair className="w-4 h-4" />}>
                {gps ? 'Rudia' : 'Chukua GPS'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Aina ya nyumba</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            <div className="grid grid-cols-1 gap-2">
              {(Object.keys(PROPERTY_TYPE_LABEL) as PropertyType[]).map((t) => (
                <label
                  key={t}
                  className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer ${
                    type === t ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-secondary-200 dark:border-slate-700'
                  }`}
                >
                  <input type="radio" name="ptype" checked={type === t} onChange={() => setType(t)} />
                  <span className="text-sm font-medium">{PROPERTY_TYPE_LABEL[t]}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-secondary-500">
              {type === 'family' && 'Kichwa 1 kwa nyumba nzima — mkuu wa kaya ndiye mlipaji.'}
              {type === 'multi_tenant' && 'Kila mpangaji ana code yake. Vyumba vitupu havilipi. Mwenye nyumba analipa kichwa 1 tu kama anatumia vyumba.'}
              {type === 'commercial' && 'Kila duka/biashara ina code yake na ada yake.'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. {type === 'multi_tenant' ? 'Mwenye nyumba' : type === 'commercial' ? 'Mmiliki wa jengo (hiari)' : 'Mkuu wa kaya'}</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            <Input label="Jina kamili" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
            <Input label="Simu" type="tel" inputMode="tel" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} />
            {type === 'family' && (
              <Input
                label="Idadi ya watu (hiari)"
                type="number"
                min={1}
                value={familySize}
                onChange={(e) => setFamilySize(e.target.value)}
              />
            )}
            {(type === 'family' || (type === 'multi_tenant' && landlordUses)) && (
              <div className="grid grid-cols-2 gap-3">
                <Input label="Deni la nyuma (TZS)" type="number" min={0} value={ownerDebt} onChange={(e) => setOwnerDebt(e.target.value)} />
                <Input label="Alishalipa (TZS)" type="number" min={0} value={ownerPaid} onChange={(e) => setOwnerPaid(e.target.value)} />
              </div>
            )}
            {type === 'multi_tenant' && (
              <>
                <Input
                  label="Jumla ya vyumba vya nyumba (taarifa tu)"
                  type="number"
                  min={0}
                  value={totalRooms}
                  onChange={(e) => setTotalRooms(e.target.value)}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={landlordUses} onChange={(e) => setLandlordUses(e.target.checked)} />
                  Mwenye nyumba anaishi/anatumia vyumba (analipa kichwa 1)
                </label>
              </>
            )}
          </CardContent>
        </Card>

        {type === 'multi_tenant' && (
          <Card>
            <CardHeader>
              <CardTitle>4. Wapangaji</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {tenants.map((t, idx) => (
                <div key={t.key} className="rounded-xl border border-secondary-200 dark:border-slate-700 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Input
                      className="!py-2"
                      placeholder={`Chumba ${idx + 1}`}
                      value={t.label}
                      onChange={(e) => setTenants(tenants.map((x) => (x.key === t.key ? { ...x, label: e.target.value } : x)))}
                    />
                    {tenants.length > 1 && (
                      <button
                        onClick={() => setTenants(tenants.filter((x) => x.key !== t.key))}
                        className="ml-2 p-2 text-secondary-400 hover:text-error-600"
                        aria-label="Futa chumba"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={t.vacant}
                      onChange={(e) => setTenants(tenants.map((x) => (x.key === t.key ? { ...x, vacant: e.target.checked } : x)))}
                    />
                    Chumba kiko wazi (hakilipi)
                  </label>
                  {!t.vacant && (
                    <>
                      <Input
                        placeholder="Jina la mpangaji"
                        value={t.name}
                        onChange={(e) => setTenants(tenants.map((x) => (x.key === t.key ? { ...x, name: e.target.value } : x)))}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Simu"
                          type="tel"
                          value={t.phone}
                          onChange={(e) => setTenants(tenants.map((x) => (x.key === t.key ? { ...x, phone: e.target.value } : x)))}
                        />
                        <Input
                          placeholder="Watu (hiari)"
                          type="number"
                          min={1}
                          value={t.size}
                          onChange={(e) => setTenants(tenants.map((x) => (x.key === t.key ? { ...x, size: e.target.value } : x)))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Deni la nyuma"
                          type="number"
                          min={0}
                          value={t.debt}
                          onChange={(e) => setTenants(tenants.map((x) => (x.key === t.key ? { ...x, debt: e.target.value } : x)))}
                        />
                        <Input
                          placeholder="Alishalipa"
                          type="number"
                          min={0}
                          value={t.paid}
                          onChange={(e) => setTenants(tenants.map((x) => (x.key === t.key ? { ...x, paid: e.target.value } : x)))}
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setTenants([...tenants, emptyUnit(`Chumba ${tenants.length + 1}`)])}
              >
                Ongeza chumba
              </Button>
            </CardContent>
          </Card>
        )}

        {type === 'commercial' && (
          <Card>
            <CardHeader>
              <CardTitle>4. Biashara / maduka</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {businesses.map((b, idx) => (
                <div key={b.key} className="rounded-xl border border-secondary-200 dark:border-slate-700 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder={`Jina la biashara #${idx + 1}`}
                      value={b.label}
                      onChange={(e) => setBusinesses(businesses.map((x) => (x.key === b.key ? { ...x, label: e.target.value } : x)))}
                    />
                    {businesses.length > 1 && (
                      <button
                        onClick={() => setBusinesses(businesses.filter((x) => x.key !== b.key))}
                        className="p-2 text-secondary-400 hover:text-error-600"
                        aria-label="Futa biashara"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Mmiliki"
                      value={b.name}
                      onChange={(e) => setBusinesses(businesses.map((x) => (x.key === b.key ? { ...x, name: e.target.value } : x)))}
                    />
                    <Input
                      placeholder="Simu"
                      type="tel"
                      value={b.phone}
                      onChange={(e) => setBusinesses(businesses.map((x) => (x.key === b.key ? { ...x, phone: e.target.value } : x)))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Deni la nyuma"
                      type="number"
                      min={0}
                      value={b.debt}
                      onChange={(e) => setBusinesses(businesses.map((x) => (x.key === b.key ? { ...x, debt: e.target.value } : x)))}
                    />
                    <Input
                      placeholder="Alishalipa"
                      type="number"
                      min={0}
                      value={b.paid}
                      onChange={(e) => setBusinesses(businesses.map((x) => (x.key === b.key ? { ...x, paid: e.target.value } : x)))}
                    />
                  </div>
                  {businessPlans.length > 0 && (
                    <Select
                      value={b.feePlanId}
                      onChange={(e) => setBusinesses(businesses.map((x) => (x.key === b.key ? { ...x, feePlanId: e.target.value } : x)))}
                      options={[
                        { value: '', label: 'Ada ya kawaida ya biashara' },
                        ...businessPlans.map((p) => ({ value: p.id, label: `${p.name} — TZS ${p.amount.toLocaleString()}` })),
                      ]}
                    />
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setBusinesses([...businesses, emptyUnit('')])}
              >
                Ongeza biashara
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="sticky bottom-16 lg:bottom-2 z-10">
          <Card>
            <CardContent className="p-3 flex items-center justify-between gap-3">
              <p className="text-sm">
                Vichwa vitakavyolipa: <b>{headCount}</b>
              </p>
              <Button isLoading={saving} onClick={handleSubmit} disabled={!companyId}>
                Hifadhi usajili
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
