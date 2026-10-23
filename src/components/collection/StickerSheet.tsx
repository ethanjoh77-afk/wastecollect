import { QRCodeSVG } from 'qrcode.react';
import { Printer } from 'lucide-react';
import { Button } from '../common';
import { UNIT_TYPE_LABEL, type UnitType } from '../../types/collection.types';

export interface StickerUnit {
  code: string;
  label: string | null;
  unit_type: UnitType;
  occupant_name: string | null;
}

/** Karatasi ya sticker za QR za kubandika mlangoni. Chapisha kwa kitufe. */
export function StickerSheet({ units, ownerName }: { units: StickerUnit[]; ownerName?: string | null }) {
  const base = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="space-y-3">
      <div className="flex justify-end print:hidden">
        <Button variant="outline" size="sm" onClick={() => window.print()} leftIcon={<Printer className="w-4 h-4" />}>
          Chapisha sticker
        </Button>
      </div>

      <div id="sticker-sheet" className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {units.map((u) => (
          <div
            key={u.code}
            className="rounded-xl border border-secondary-200 dark:border-slate-600 bg-white p-3 text-center text-black"
            style={{ breakInside: 'avoid' }}
          >
            <p className="text-[10px] font-semibold tracking-wide">ADA YA TAKA</p>
            <div className="flex justify-center my-1.5">
              <QRCodeSVG value={`${base}/collect/unit/${u.code}`} size={96} />
            </div>
            <p className="font-mono text-sm font-bold">{u.code}</p>
            <p className="text-[11px] leading-tight">
              {u.label || UNIT_TYPE_LABEL[u.unit_type]}
              {u.occupant_name ? ` — ${u.occupant_name}` : ownerName ? ` — ${ownerName}` : ''}
            </p>
          </div>
        ))}
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #sticker-sheet, #sticker-sheet * { visibility: visible; }
          #sticker-sheet { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}
