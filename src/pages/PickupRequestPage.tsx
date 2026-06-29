import { useState } from "react";
import { supabase } from "../lib/supabase";
import { createActivity } from "../lib/activityService";
import { useAuth } from "../hooks/useAuth";

export default function PickupRequestPage() {
  const { user } = useAuth();

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

    alert("Pickup request submitted successfully.");

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
        Request Waste Pickup
      </h1>

      <form onSubmit={submitRequest} className="space-y-4">

        <input
          className="w-full border rounded p-3"
          placeholder="Pickup Address"
          value={location}
          onChange={(e)=>setLocation(e.target.value)}
          required
        />

        <select
          className="w-full border rounded p-3"
          value={wasteType}
          onChange={(e)=>setWasteType(e.target.value)}
        >
          <option>Household</option>
          <option>Plastic</option>
          <option>Organic</option>
          <option>Electronic</option>
          <option>Glass</option>
        </select>

        <select
          className="w-full border rounded p-3"
          value={quantity}
          onChange={(e)=>setQuantity(e.target.value)}
        >
          <option>Small</option>
          <option>Medium</option>
          <option>Large</option>
        </select>

        <input
          className="w-full border rounded p-3"
          placeholder="Phone Number"
          value={phone}
          onChange={(e)=>setPhone(e.target.value)}
        />

        <input
          type="date"
          className="w-full border rounded p-3"
          value={pickupDate}
          onChange={(e)=>setPickupDate(e.target.value)}
        />

        <textarea
          className="w-full border rounded p-3"
          rows={4}
          placeholder="Additional Notes"
          value={notes}
          onChange={(e)=>setNotes(e.target.value)}
        />

        <button
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white rounded p-3"
        >
          {loading ? "Submitting..." : "Request Pickup"}
        </button>

      </form>

    </div>
  );
}