import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { createPayment } from "../lib/paymentService";
import toast from "react-hot-toast";

type PaymentMethod =
  | "mpesa"
  | "airtel_money"
  | "tigo_pesa"
  | "halopesa"
  | "card"
  | "bank_transfer";

export default function PaymentPage() {
  const { user } = useAuth();

  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<PaymentMethod>("mpesa");
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!user) {
      toast.error("Please login first");
      return;
    }

    if (amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setLoading(true);

    try {
      const payment = await createPayment({
        user_id: user.id,
        amount,
        payment_method: method,
      });

      console.log(payment);

      toast.success("Payment created successfully");

      setAmount(0);
      setMethod("mpesa");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow space-y-4">
      <h1 className="text-2xl font-bold text-center">
        Waste Collection Payment
      </h1>

      <input
        type="number"
        min={1}
        placeholder="Enter amount"
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
        <option value="card">Card</option>
        <option value="bank_transfer">Bank Transfer</option>
      </select>

      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-green-600 text-white rounded-lg p-3 hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? "Processing..." : "Pay Now"}
      </button>
    </div>
  );
}