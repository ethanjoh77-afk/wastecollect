import { Printer, Share2, CheckCircle2, CloudOff } from 'lucide-react';
import { Button } from '../common';
import { PAY_METHOD_LABEL, type PaymentReceipt } from '../../types/collection.types';
import { money } from './PayStatusBadge';

interface Props {
  receipt: PaymentReceipt;
  onDone: () => void;
}

export function Receipt({ receipt, onDone }: Props) {
  const text =
    `RISITI ${receipt.receipt_no}\n` +
    `Code: ${receipt.code}\n` +
    (receipt.payer_name ? `Jina: ${receipt.payer_name}\n` : '') +
    `Kiasi: ${money(receipt.amount)}\n` +
    `Njia: ${PAY_METHOD_LABEL[receipt.method]}\n` +
    `Tarehe: ${new Date(receipt.created_at).toLocaleString('sw-TZ')}` +
    (receipt.balance_after !== null ? `\nDeni lililobaki: ${money(Math.max(receipt.balance_after, 0))}` : '');

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Risiti ya ada ya taka', text });
        return;
      } catch {
        return;
      }
    }
    window.location.href = `sms:?body=${encodeURIComponent(text)}`;
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        {receipt.queued ? (
          <CloudOff className="w-12 h-12 mx-auto text-warning-500" />
        ) : (
          <CheckCircle2 className="w-12 h-12 mx-auto text-success-500" />
        )}
        <h2 className="mt-2 text-lg font-semibold">
          {receipt.queued ? 'Imehifadhiwa (offline)' : 'Malipo yamepokelewa'}
        </h2>
        {receipt.queued && (
          <p className="text-xs text-secondary-500">
            Itatumwa kwenye mfumo mtandao ukirudi. Namba ya risiti ya mwisho itatolewa baada ya kutuma.
          </p>
        )}
      </div>

      {/* Eneo linalochapishwa (karatasi ya 58mm) */}
      <div
        id="receipt-print"
        className="mx-auto max-w-xs rounded-xl border border-dashed border-secondary-300 dark:border-slate-600 p-4 font-mono text-sm space-y-1"
      >
        <p className="text-center font-bold">RISITI YA ADA YA TAKA</p>
        <p className="text-center text-xs">{receipt.receipt_no}</p>
        <hr className="my-2 border-dashed" />
        <p>Code: {receipt.code}</p>
        {receipt.payer_name && <p>Jina: {receipt.payer_name}</p>}
        <p>Kiasi: {money(receipt.amount)}</p>
        <p>Njia: {PAY_METHOD_LABEL[receipt.method]}</p>
        <p>Tarehe: {new Date(receipt.created_at).toLocaleString('sw-TZ')}</p>
        {receipt.balance_after !== null && (
          <p className="font-bold">Deni lililobaki: {money(Math.max(receipt.balance_after, 0))}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 justify-center print:hidden">
        <Button variant="outline" onClick={() => window.print()} leftIcon={<Printer className="w-4 h-4" />}>
          Chapisha
        </Button>
        <Button variant="outline" onClick={share} leftIcon={<Share2 className="w-4 h-4" />}>
          Tuma SMS / Shiriki
        </Button>
        <Button onClick={onDone}>Maliza</Button>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-print, #receipt-print * { visibility: visible; }
          #receipt-print { position: absolute; left: 0; top: 0; width: 58mm; border: none; font-size: 11px; }
          @page { size: 58mm auto; margin: 2mm; }
        }
      `}</style>
    </div>
  );
}
