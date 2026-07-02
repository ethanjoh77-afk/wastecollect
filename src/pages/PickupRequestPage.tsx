import { useState } from "react";
import { supabase } from "../lib/supabase";
import { createActivity } from "../lib/activityService";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "react-i18next";

export default function PickupRequestPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [location, setLocation] = useState("");
  const [wasteType, setWasteType] = useState("Household");
  const [quantity, setQuantity] = useState("Small");
  const [phone, setPhone] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const { error } = await supabase
      .from("pickup_requests")
      .insert({
        user_id: user.id,
        location,
        waste_type: wasteType,
        quantity,
        phone,
        pickup_date: pickupDate,
        notes,
        status: "pending",
      });

    if (!error) {
      await createActivity({
        type: "collection",
        title: "Pickup Requested",
        description: `${quantity} ${wasteType} waste at ${location}`,
        user_id: user.id,
        role: "citizen",
      });
    }

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert(t('pickup_success'));
    setLocation("");
    setWasteType("Household");
    setQuantity("Small");
    setPhone("");
    setPickupDate("");
    setNotes("");
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        {t('pickup_title')}
      </h1>
      <form onSubmit={submitRequest} className="space-y-4">
        <input
          className="w-full border rounded p-3"
          placeholder={t('pickup_address')}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />
        <select
          className="w-full border rounded p-3"
          value={wasteType}
          onChange={(e) => setWasteType(e.target.value)}
        >
          <option value="Household">{t('waste_type_household')}</option>
          <option value="Plastic">{t('waste_type_plastic')}</option>
          <option value="Organic">{t('waste_type_organic')}</option>
          <option value="Electronic">{t('waste_type_electronic')}</option>
          <option value="Glass">{t('waste_type_glass')}</option>
        </select>
        <select
          className="w-full border rounded p-3"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        >
          <option value="Small">{t('quantity_small')}</option>
          <option value="Medium">{t('quantity_medium')}</option>
          <option value="Large">{t('quantity_large')}</option>
        </select>
        <input
          className="w-full border rounded p-3"
          placeholder={t('pickup_phone')}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          type="date"
          className="w-full border rounded p-3"
          value={pickupDate}
          onChange={(e) => setPickupDate(e.target.value)}
        />
        <textarea
          className="w-full border rounded p-3"
          rows={4}
          placeholder={t('pickup_notes')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white rounded p-3"
        >
          {loading ? t('pickup_submitting') : t('pickup_request_btn')}
        </button>
      </form>
    </div>
  );
}