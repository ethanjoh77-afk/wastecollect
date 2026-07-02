import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
}

export default function AdminFinancePage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadPayments() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError("Imeshindwa kupakia taarifa za malipo.");
      setLoading(false);
      return;
    }

    setPayments(data ?? []);

    const total = (data ?? []).reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    setTotalRevenue(total);
    setLoading(false);
  }

  useEffect(() => {
    loadPayments();

    const channel = supabase
      .channel("payments-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payments" },
        () => loadPayments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return <div className="p-6">Loading finance dashboard...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Finance Dashboard</h1>

      <div className="bg-green-600 text-white rounded-xl p-6">
        <p>Total Revenue</p>
        <h2 className="text-3xl font-bold mt-2">
          TZS {totalRevenue.toLocaleString()}
        </h2>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">Amount</th>
              <th className="text-left p-3">Method</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-500">
                  Hakuna malipo yaliyorekodiwa bado.
                </td>
              </tr>
            )}

            {payments.map((payment) => (
              <tr key={payment.id} className="border-b">
                <td className="p-3">
                  TZS {Number(payment.amount).toLocaleString()}
                </td>
                <td className="p-3 capitalize">
                  {payment.payment_method?.replace("_", " ") ?? "—"}
                </td>
                <td className="p-3">{payment.status}</td>
                <td className="p-3">
                  {new Date(payment.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}