import { CreditCard } from "lucide-react";

export default function PayWasteFee() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="w-8 h-8 text-green-600" />
          <h1 className="text-3xl font-bold">
            Pay Waste Collection Fee
          </h1>
        </div>

        <form className="space-y-5">
          <input
            type="text"
            placeholder="Citizen Name"
            className="w-full border rounded-lg p-3"
          />

          <input
            type="text"
            placeholder="House Number"
            className="w-full border rounded-lg p-3"
          />

          <input
            type="number"
            placeholder="Amount"
            className="w-full border rounded-lg p-3"
          />

          <select className="w-full border rounded-lg p-3">
            <option>M-Pesa</option>
            <option>Tigo Pesa</option>
            <option>Airtel Money</option>
            <option>Bank</option>
          </select>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg"
          >
            Proceed Payment
          </button>
        </form>
      </div>
    </div>
  );
}