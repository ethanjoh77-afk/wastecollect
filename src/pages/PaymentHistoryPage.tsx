import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { getUserPayments } from "../lib/paymentService";

type Payment = {
  id: string;
  receipt_number: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
};

export default function PaymentHistoryPage() {
  const { user } = useAuth();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const loadPayments = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const data = await getUserPayments(user.id);
        setPayments(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
  }, [user]);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const matchesSearch =
        payment.receipt_number
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        payment.payment_method
          ?.toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || payment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [payments, search, statusFilter]);

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold">Payment History</h1>
        <p className="text-gray-500">
          View all your payment records
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">

        <input
          type="text"
          placeholder="Search receipt or method..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-4 py-2 flex-1"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-lg px-4 py-2"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>

      </div>

      {loading ? (
        <div className="text-center py-10">
          Loading payments...
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="text-center py-10 border rounded-xl">
          No payment records found.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-xl shadow">
          <table className="w-full">

            <thead className="bg-gray-100 dark:bg-slate-700">

              <tr>

                <th className="text-left p-4">Receipt</th>

                <th className="text-left p-4">Amount</th>

                <th className="text-left p-4">Method</th>

                <th className="text-left p-4">Status</th>

                <th className="text-left p-4">Date</th>

              </tr>

            </thead>

            <tbody>

              {filteredPayments.map((payment) => (

                <tr
                  key={payment.id}
                  className="border-t hover:bg-gray-50 dark:hover:bg-slate-700"
                >

                  <td className="p-4 font-medium">
                    {payment.receipt_number}
                  </td>

                  <td className="p-4">
                    TZS {Number(payment.amount).toLocaleString()}
                  </td>

                  <td className="p-4 capitalize">
                    {payment.payment_method.replace("_", " ")}
                  </td>

                  <td className="p-4">

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold
                      ${
                        payment.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : payment.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : payment.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {payment.status}
                    </span>

                  </td>

                  <td className="p-4">
                    {new Date(payment.created_at).toLocaleString()}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>
        </div>
      )}
    </div>
  );
}