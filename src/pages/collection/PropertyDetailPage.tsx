import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Plus, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { DashboardLayout } from '../../components/layout';
import { Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Input, Modal, Select } from '../../components/common';
import { PayStatusBadge, money } from '../../components/collection/PayStatusBadge';
import { StickerSheet } from '../../components/collection/StickerSheet';
import { addUnitToProperty, getProperty, listPropertyUnits, updatePropertyInfo, type PropertyRow } from '../../services/collectionService';
import {
  PROPERTY_TYPE_LABEL,
  UNIT_TYPE_LABEL,
  type PropertyType,
  type UnitStatusRow,
  type UnitType,
} from '../../types/collection.types';

const ADDABLE: Record<PropertyType, UnitType[]> = {
  family: [],
  multi_tenant: ['tenant', 'landlord'],
  commercial: ['business'],
};

export default function PropertyDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<PropertyRow | null>(null);
  const [units, setUnits] = useState<UnitStatusRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStickers, setShowStickers] = useState(false);

  const [editForm, setEditForm] = useState<{ owner_name: string; owner_phone: string; total_rooms: string; address: string } | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState<UnitType>('tenant');
  const [addLabel, setAddLabel] = useState('');
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, u] = await Promise.all([getProperty(id), listPropertyUnits(id)]);
      setProperty(p);
      setUnits(u);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const addable = property ? ADDABLE[property.property_type] : [];
  const hasLandlord = units.some((u) => u.unit_type === 'landlord');
  const addableNow = addable.filter((t) => !(t === 'landlord' && hasLandlord));

  async function handleAdd() {
    try {
      await addUnitToProperty({
        propertyId: id,
        unitType: addType,
        label: addLabel.trim(),
        occupant: addName.trim() ? { full_name: addName.trim(), phone: addPhone.trim() } : null,
      });
      toast.success('Kichwa kimeongezwa.');
      setShowAdd(false);
      setAddLabel('');
      setAddName('');
      setAddPhone('');
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleSaveProperty() {
    if (!property || !editForm) return;
    try {
      await updatePropertyInfo({
        propertyId: property.id,
        ownerName: editForm.owner_name,
        ownerPhone: editForm.owner_phone,
        totalRooms: editForm.total_rooms ? Number(editForm.total_rooms) : null,
        address: editForm.address,
        lat: property.location_lat,
        lng: property.location_lng,
      });
      toast.success('Taarifa za nyumba zimehifadhiwa.');
      setEditForm(null);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const totalDebt = units.reduce((s, u) => s + Math.max(u.balance ?? 0, 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-4 max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-secondary-500">
          <ArrowLeft className="w-4 h-4" /> Rudi
        </button>

        {loading ? (
          <div className="py-16 text-center text-secondary-500">Inapakia…</div>
        ) : !property ? (
          <EmptyState variant="not-found" title="Nyumba haijapatikana" />
        ) : (
          <>
            <Card>
              <CardContent className="p-5 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h1 className="text-xl font-bold">{property.owner_name || 'Nyumba'}</h1>
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Pencil className="w-4 h-4" />}
                    onClick={() =>
                      setEditForm({
                        owner_name: property.owner_name ?? '',
                        owner_phone: property.owner_phone ?? '',
                        total_rooms: property.total_rooms ? String(property.total_rooms) : '',
                        address: property.address ?? '',
                      })
                    }
                  >
                    Hariri
                  </Button>
                </div>
                <p className="text-sm text-secondary-500">
                  {PROPERTY_TYPE_LABEL[property.property_type]}
                  {property.address ? ` • ${property.address}` : ''}
                  {property.total_rooms ? ` • vyumba ${property.total_rooms}` : ''}
                </p>
                {property.owner_phone && (
                  <a href={`tel:${property.owner_phone}`} className="text-sm text-primary-600">
                    {property.owner_phone}
                  </a>
                )}
                <p className="pt-2 text-sm">
                  Deni la nyumba: <b className={totalDebt > 0 ? 'text-error-600' : 'text-success-600'}>{money(totalDebt)}</b>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>Vichwa vya kulipa ({units.length})</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" leftIcon={<QrCode className="w-4 h-4" />} onClick={() => setShowStickers((s) => !s)}>
                      Sticker
                    </Button>
                    {addableNow.length > 0 && (
                      <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => { setAddType(addableNow[0]); setShowAdd(true); }}>
                        Ongeza
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-secondary-100 dark:divide-slate-700">
                  {units.map((u) => (
                    <li key={u.billing_unit_id}>
                      <Link to={`/collect/unit/${u.code}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-secondary-50 dark:hover:bg-slate-700/40">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{u.full_name ?? 'Wazi'}</p>
                          <p className="text-xs text-secondary-500 truncate">
                            <span className="font-mono">{u.code}</span> • {u.label || UNIT_TYPE_LABEL[u.unit_type]}
                          </p>
                        </div>
                        <div className="text-right shrink-0 space-y-1">
                          <PayStatusBadge status={u.pay_status} />
                          {u.pay_status !== 'vacant' && (
                            <p className="text-xs font-semibold">{money(Math.max(u.balance ?? 0, 0))}</p>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {showStickers && <StickerSheet
                units={units.map((u) => ({ code: u.code, label: u.label, unit_type: u.unit_type, occupant_name: u.full_name }))}
                ownerName={property.owner_name}
              />}
          </>
        )}
      </div>

      <Modal isOpen={!!editForm} onClose={() => setEditForm(null)} title="Hariri taarifa za nyumba">
        {editForm && (
          <div className="space-y-3">
            <Input label="Jina la mmiliki / mkuu wa kaya" value={editForm.owner_name} onChange={(e) => setEditForm({ ...editForm, owner_name: e.target.value })} />
            <Input label="Simu" type="tel" value={editForm.owner_phone} onChange={(e) => setEditForm({ ...editForm, owner_phone: e.target.value })} />
            <Input label="Jumla ya vyumba (taarifa tu)" type="number" min={0} value={editForm.total_rooms} onChange={(e) => setEditForm({ ...editForm, total_rooms: e.target.value })} />
            <Input label="Anwani / maelezo ya eneo" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
            <Button className="w-full" onClick={handleSaveProperty}>
              Hifadhi
            </Button>
          </div>
        )}
      </Modal>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Ongeza kichwa">
        <div className="space-y-3">
          <Select
            label="Aina"
            value={addType}
            onChange={(e) => setAddType(e.target.value as UnitType)}
            options={addableNow.map((t) => ({ value: t, label: UNIT_TYPE_LABEL[t] }))}
          />
          <Input label="Jina la chumba/biashara" value={addLabel} onChange={(e) => setAddLabel(e.target.value)} />
          <Input label="Jina la mkazi (acha tupu = wazi)" value={addName} onChange={(e) => setAddName(e.target.value)} />
          <Input label="Simu (hiari)" type="tel" value={addPhone} onChange={(e) => setAddPhone(e.target.value)} />
          <Button className="w-full" onClick={handleAdd}>
            Hifadhi
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
