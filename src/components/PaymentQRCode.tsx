import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";

/**
 * DEMO PLACEHOLDER DATA
 * -----------------------------------------------------------
 * Namba na jina hapa chini ni za MFANO tu kwa ajili ya demo.
 * Zibadilishe na namba HALISI za biashara (Paybill/Till) mara
 * zitakapopatikana kutoka kwa mtoa huduma (M-Pesa, Tigo Pesa,
 * Airtel Money, HaloPesa) kabla ya kuweka live kwa wateja halisi.
 *
 * QR hii inaonyesha taarifa za malipo (scan → soma → mteja
 * anaingiza namba mwenyewe kwenye simu yake). Kwa QR inayojaza
 * taarifa moja kwa moja (auto-fill ya kiasi/namba), biashara
 * inahitaji kusajiliwa rasmi kwenye mtandao wa TIPS (Tanzania
 * Instant Payment System) au kupitia mtoa huduma husika.
 */
const DEMO_PAYMENT_INFO = {
  businessName: "WasteCollect (Demo)",
  provider: "M-Pesa",
  paybillOrTill: "XXXXXX",
};

interface PaymentQRCodeProps {
  amount?: number;
}

export default function PaymentQRCode({ amount }: PaymentQRCodeProps) {
  const { t } = useTranslation();

  const qrValue = [
    `Biashara: ${DEMO_PAYMENT_INFO.businessName}`,
    `Mtoa huduma: ${DEMO_PAYMENT_INFO.provider}`,
    `Namba: ${DEMO_PAYMENT_INFO.paybillOrTill}`,
    amount ? `Kiasi: TZS ${amount.toLocaleString()}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="flex flex-col items-center gap-3 border border-dashed border-gray-300 rounded-xl p-5 bg-gray-50">
      <span className="text-xs font-semibold uppercase tracking-wide text-amber-600 bg-amber-50 px-2 py-1 rounded">
        {t("payment_qr_demo_label", "Demo - namba halisi zitawekwa hivi karibuni")}
      </span>

      <QRCodeSVG value={qrValue} size={180} level="M" includeMargin />

      <div className="text-center">
        <p className="font-semibold text-gray-800">{DEMO_PAYMENT_INFO.businessName}</p>
        <p className="text-sm text-gray-500">
          {DEMO_PAYMENT_INFO.provider} · {DEMO_PAYMENT_INFO.paybillOrTill}
        </p>
      </div>

      <p className="text-xs text-gray-400 text-center max-w-xs">
        {t(
          "payment_qr_scan_note",
          "Piga picha (scan) QR hii kwa kamera ya simu yako, kisha ingiza kiasi cha malipo kwenye app ya M-Pesa/Tigo Pesa/Airtel Money."
        )}
      </p>
    </div>
  );
}