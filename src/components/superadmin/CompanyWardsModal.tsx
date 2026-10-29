import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Button, Modal } from '../common';
import { getCompanyWardIds, listAllWards, setCompanyWards, type WardOption } from '../../services/companyWardsService';

interface Props {
  company: { id: string; name: string } | null;
  onClose: () => void;
}

/** Super admin: kuipa kampuni kata inazozihudumia (ripoti za kata hizo zinaenda kwa kampuni hiyo). */
export function CompanyWardsModal({ company, onClose }: Props) {
  const [wards, setWards] = useState<WardOption[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!company) return;
    let cancelled = false;
    Promise.all([listAllWards(), getCompanyWardIds(company.id)])
      .then(([w, ids]) => {
        if (cancelled) return;
        setWards(w);
        setSelected(ids);
      })
      .catch((e: Error) => toast.error(e.message));
    return () => {
      cancelled = true;
    };
  }, [company]);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  async function save() {
    if (!company) return;
    setSaving(true);
    try {
      await setCompanyWards(company.id, selected);
      toast.success('Kata za kampuni zimehifadhiwa.');
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={!!company} onClose={onClose} title={company ? `Kata za ${company.name}` : ''}>
      <div className="space-y-3">
        <p className="text-sm text-secondary-500">
          Ripoti za taka kutoka kata ulizochagua zitaenda kwa kampuni hii. Ukichagua kata moja kwa kampuni zaidi ya moja,
          mwananchi atachagua kampuni.
        </p>
        <div className="max-h-64 overflow-y-auto space-y-1 rounded-xl border border-secondary-200 dark:border-slate-700 p-2">
          {wards.map((w) => (
            <label key={w.id} className="flex items-center gap-2 text-sm px-2 py-1">
              <input type="checkbox" checked={selected.includes(w.id)} onChange={() => toggle(w.id)} />
              {w.name}
            </label>
          ))}
          {wards.length === 0 && <p className="text-xs text-secondary-500 p-2">Hakuna kata zilizopatikana.</p>}
        </div>
        <Button className="w-full" isLoading={saving} onClick={save}>
          Hifadhi ({selected.length})
        </Button>
      </div>
    </Modal>
  );
}
