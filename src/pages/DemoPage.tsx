import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, Home, MapPin, ScanLine, ShieldCheck, Truck, User, Users } from 'lucide-react';

/**
 * DEMO — data za mfano tu. Haiguswi Supabase wala login; haibadilishi chochote kwenye mfumo.
 * Inaonyesha mfumo unavyofanya kazi kwa kila role.
 */

type Tab = 'citizen' | 'company' | 'collector' | 'super';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'citizen', label: 'Mwananchi', icon: User },
  { id: 'company', label: 'Admin wa kampuni', icon: Building2 },
  { id: 'collector', label: 'Mkusanyaji', icon: ScanLine },
  { id: 'super', label: 'Super Admin', icon: ShieldCheck },
];

const money = (n: number) => `TZS ${n.toLocaleString()}`;

const HOUSES = [
  { code: 'KM-0012', name: 'Asha Juma', type: 'Familia', debt: 0, status: 'Amelipa' },
  { code: 'KM-0013', name: 'Hamisi Salum (Chumba 1)', type: 'Mpangaji', debt: 10000, status: 'Anadaiwa' },
  { code: 'KM-0014', name: 'Neema Peter (Chumba 2)', type: 'Mpangaji', debt: 5000, status: 'Amelipa sehemu' },
  { code: 'KM-0015', name: 'Duka la Mama Rose', type: 'Biashara', debt: 20000, status: 'Anadaiwa' },
];

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-5 space-y-3">
      <h3 className="font-semibold text-secondary-900 dark:text-white">{title}</h3>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary-50 dark:bg-slate-900 p-4 text-center">
      <p className="text-xs text-secondary-500">{label}</p>
      <p className="text-xl font-bold text-secondary-900 dark:text-white">{value}</p>
    </div>
  );
}

function CitizenDemo() {
  return (
    <div className="space-y-4">
      <Card title="Ripoti ya taka">
        <p className="text-sm text-secondary-600 dark:text-secondary-300">
          Mwananchi anachagua kata yake. Ripoti inaenda moja kwa moja kwa kampuni inayohudumia kata hiyo. Kama kata ina kampuni
          zaidi ya moja, anachagua kampuni.
        </p>
        <div className="grid gap-2 text-sm">
          <div className="rounded-lg border border-secondary-200 dark:border-slate-700 p-3">Aina: Taka zimetupwa ovyo</div>
          <div className="rounded-lg border border-secondary-200 dark:border-slate-700 p-3">Kata: Kinondoni</div>
          <div className="rounded-lg border border-secondary-200 dark:border-slate-700 p-3">Kampuni: SafiMji Ltd</div>
        </div>
        <p className="text-xs text-success-600">✓ Arifa inaenda kwa admin wa SafiMji Ltd tu. Super admin hapokei.</p>
      </Card>
      <Card title="Hali ya ripoti zangu">
        <ul className="text-sm divide-y divide-secondary-100 dark:divide-slate-700">
          <li className="py-2 flex justify-between"><span>Taka Mtaa wa Mwenge</span><span className="text-blue-600">Amepangiwa dereva</span></li>
          <li className="py-2 flex justify-between"><span>Pipa la taka limejaa</span><span className="text-success-600">Imeshughulikiwa</span></li>
        </ul>
      </Card>
    </div>
  );
}

function CompanyDemo() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Kaya zilizosajiliwa" value="1,248" />
        <Stat label="Mapato mwezi huu" value={money(4_860_000)} />
        <Stat label="Madeni" value={money(1_320_000)} />
      </div>
      <Card title="Nyumba na madeni">
        <ul className="divide-y divide-secondary-100 dark:divide-slate-700">
          {HOUSES.map((h) => (
            <li key={h.code} className="py-3 flex items-center justify-between gap-3 text-sm">
              <div>
                <p className="font-medium">{h.name}</p>
                <p className="text-xs text-secondary-500">{h.code} • {h.type}</p>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${h.debt > 0 ? 'text-error-600' : 'text-success-600'}`}>{money(h.debt)}</p>
                <p className="text-xs text-secondary-500">{h.status}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="text-xs text-secondary-500">
          Admin wa kampuni anaweza kuhariri taarifa, kuweka deni la awali, na "Badilisha mkazi" (deni la wa zamani linabaki kwake).
        </p>
      </Card>
      <Card title="Wafanyakazi">
        <ul className="text-sm divide-y divide-secondary-100 dark:divide-slate-700">
          <li className="py-2 flex justify-between"><span>Juma Bakari</span><span className="text-secondary-500">Dereva</span></li>
          <li className="py-2 flex justify-between"><span>Grace Mushi</span><span className="text-secondary-500">Mkusanyaji</span></li>
        </ul>
        <p className="text-xs text-secondary-500">Madereva husajiliwa na kampuni, hawajisajili wenyewe.</p>
      </Card>
    </div>
  );
}

function CollectorDemo() {
  return (
    <div className="space-y-4">
      <Card title="Skani code ya kaya">
        <div className="flex items-center gap-3 rounded-xl bg-secondary-50 dark:bg-slate-900 p-4">
          <ScanLine className="w-8 h-8 text-primary-600" />
          <div>
            <p className="font-mono font-semibold">KM-0013</p>
            <p className="text-sm text-secondary-500">Hamisi Salum • Chumba 1</p>
          </div>
        </div>
        <div className="rounded-xl bg-secondary-50 dark:bg-slate-900 p-4 text-center">
          <p className="text-xs text-secondary-500">Deni la sasa</p>
          <p className="text-3xl font-bold text-error-600">{money(10000)}</p>
        </div>
        <button className="w-full py-3 rounded-xl bg-primary-500 text-white font-medium" disabled>
          Pokea {money(10000)} (demo)
        </button>
      </Card>
      <Card title="Ramani ya kaya">
        <div className="flex items-center gap-2 text-sm text-secondary-600 dark:text-secondary-300">
          <MapPin className="w-4 h-4 text-success-600" /> Kijani: wamelipa
          <MapPin className="w-4 h-4 text-warning-500 ml-3" /> Njano: sehemu
          <MapPin className="w-4 h-4 text-error-600 ml-3" /> Nyekundu: wanadaiwa
        </div>
      </Card>
    </div>
  );
}

function SuperDemo() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Kampuni" value="6" />
        <Stat label="Subscriptions hai" value="5" />
        <Stat label="Ripoti zisizo na kampuni" value="2" />
      </div>
      <Card title="Kampuni na kata zake">
        <ul className="text-sm divide-y divide-secondary-100 dark:divide-slate-700">
          <li className="py-2 flex justify-between"><span>SafiMji Ltd</span><span className="text-secondary-500">Kinondoni, Mwenge</span></li>
          <li className="py-2 flex justify-between"><span>CleanCity</span><span className="text-secondary-500">Ilala, Kariakoo</span></li>
        </ul>
      </Card>
      <Card title="Faragha ya kampuni">
        <div className="flex items-start gap-3 text-sm text-secondary-600 dark:text-secondary-300">
          <ShieldCheck className="w-5 h-5 text-primary-600 shrink-0" />
          <p>
            Super admin anaingiza data za kampuni na kuunda admin wake. Mapato, makusanyo na usajili wa kaya ni siri ya kila
            kampuni — hayaonekani kwa super admin.
          </p>
        </div>
      </Card>
    </div>
  );
}

export default function DemoPage() {
  const [tab, setTab] = useState<Tab>('citizen');

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Link to="/login" className="inline-flex items-center gap-1 text-sm text-secondary-500">
            <ArrowLeft className="w-4 h-4" /> Rudi
          </Link>
          <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700">Demo — data za mfano</span>
        </div>

        <h1 className="text-2xl font-bold text-secondary-900 dark:text-white flex items-center gap-2">
          <Home className="w-6 h-6 text-primary-600" /> WasteCollect — Tazama mfumo
        </h1>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-colors ${
                tab === id
                  ? 'bg-primary-500 text-white'
                  : 'bg-white dark:bg-slate-800 text-secondary-600 dark:text-secondary-300'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {tab === 'citizen' && <CitizenDemo />}
        {tab === 'company' && <CompanyDemo />}
        {tab === 'collector' && <CollectorDemo />}
        {tab === 'super' && <SuperDemo />}

        <p className="text-center text-xs text-secondary-500 flex items-center justify-center gap-1">
          <Truck className="w-3 h-3" /> <Users className="w-3 h-3" /> Hakuna data halisi inayoguswa kwenye demo hii.
        </p>
      </div>
    </div>
  );
}
