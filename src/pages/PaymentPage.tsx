import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { createPayment, PaymentMethod } from "../lib/paymentService";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import PaymentQRCode from "../components/PaymentQRCode";

const MAX_AMOUNT = 10_000_000; // TZS 10M - epuka makosa ya kuandika

export default function PaymentPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<PaymentMethod>("mpesa");
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!user) {
      toast.error(t('payment_login_required'));
      return;
    }
    if (amount <= 0) {
      toast.error(t('payment_invalid_amount'));
      return;
    }
    if (amount > MAX_AMOUNT) {
      toast.error(t('payment_amount_exceeded'));
      return;
    }

    setLoading(true);
    try {
      await createPayment({
        user_id: user.id,
        amount,
        payment_method: method,
      });

      toast.success(t('payment_success'), { duration: 5000 });
      setAmount(0);
      setMethod("mpesa");
    } catch (err: any) {
      toast.error(err.message || t('payment_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow space-y-4">
      <h1 className="text-2xl font-bold text-center">
        {t('payment_title')}
      </h1>

      <input
        type="number"
        min={1}
        placeholder={t('enter_amount')}
        value={amount || ""}
        onChange={(e) => setAmount(Number(e.target.value))}
        className="w-full border rounded-lg p-3"
      />

      <select
        value={method}
        onChange={(e) => setMethod(e.target.value as PaymentMethod)}
        className="w-full border rounded-lg p-3"
      >
        <option value="mpesa">M-Pesa</option>
        <option value="airtel_money">Airtel Money</option>
        <option value="tigo_pesa">Tigo Pesa</option>
        <option value="halopesa">HaloPesa</option>
        <option value="card">{t('payment_method_card')}</option>
        <option value="bank_transfer">{t('payment_method_bank')}</option>
      </select>

      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-green-600 text-white rounded-lg p-3 hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? t('processing') : t('pay_now')}
      </button>

      <p className="text-xs text-gray-400 text-center">
        {t('payment_confirm_note')}
      </p>

      <PaymentQRCode amount={amount || undefined} />
    </div>
  );
}