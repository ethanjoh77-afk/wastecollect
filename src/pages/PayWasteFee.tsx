import { CreditCard } from "lucide-react";
import { Input } from "../components/common/Input";
import { Select } from "../components/common/Select";

export default function PayWasteFee() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="w-8 h-8 text-green-600" />
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">
            Pay Waste Collection Fee
          </h1>
        </div>

        <form className="space-y-5">
          <Input type="text" placeholder="Citizen Name" />

          <Input type="text" placeholder="House Number" />

          <Input type="number" placeholder="Amount" />

          <Select
            options={[
              { value: "mpesa", label: "M-Pesa" },
              { value: "tigo_pesa", label: "Tigo Pesa" },
              { value: "airtel_money", label: "Airtel Money" },
              { value: "bank", label: "Bank" },
            ]}
          />

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg"
          >
            Proceed Payment
          </button>
        </form>
      </div>
    </div>
  );
}