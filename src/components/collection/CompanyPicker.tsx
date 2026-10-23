import { Select } from '../common';
import type { CollectionCompany } from '../../hooks/useCollectionCompany';

interface Props {
  companies: CollectionCompany[];
  value: string | null;
  onChange: (id: string) => void;
}

/** Inaonekana tu kama mtumiaji ana zaidi ya kampuni moja (mf. super admin). */
export function CompanyPicker({ companies, value, onChange }: Props) {
  if (companies.length < 2) return null;
  return (
    <div className="max-w-xs">
      <Select
        label="Kampuni"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        options={companies.map((c) => ({ value: c.id, label: c.name }))}
      />
    </div>
  );
}
