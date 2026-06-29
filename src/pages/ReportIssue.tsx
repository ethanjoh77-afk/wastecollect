import { useState } from "react";
import { AlertTriangle } from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { createActivity } from "../lib/activityService";
import { uploadReportPhoto } from "../lib/storageService";

export default function ReportIssue() {
  const { user } = useAuth();

  const [reportType, setReportType] = useState("illegal_dumping");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");

  const [photo, setPhoto] = useState<File | null>(null);

  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationLat(position.coords.latitude);
        setLocationLng(position.coords.longitude);

        alert("Location captured successfully.");
      },
      (error) => {
        console.error(error);
        alert("Unable to get your current location.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert("Please login first.");
      return;
    }

    if (!description.trim() || !address.trim()) {
      alert("Please fill all required fields.");
      return;
    }

    setLoading(true);

    try {
      let photoUrl: string | null = null;

      if (photo) {
        photoUrl = await uploadReportPhoto(photo);
      }

      const { data: report, error } = await supabase
        .from("waste_reports")
        .insert({
          citizen_id: user.id,
          report_type: reportType,
          description: description.trim(),
          address: address.trim(),
          status: "pending",

          location_lat: locationLat,
          location_lng: locationLng,

          photos: photoUrl ? [photoUrl] : [],
        })
        .select()
        .single();

      if (error) throw error;

      await createActivity({
        type: "report",
        title: "Waste Report Submitted",
        description: `${reportType.replaceAll("_", " ")} - ${description}`,
        user_id: user.id,
        role: user.role ?? "citizen",
      });

      setReportType("illegal_dumping");
      setDescription("");
      setAddress("");
      setPhoto(null);
      setLocationLat(null);
      setLocationLng(null);

      alert("Waste report submitted successfully.");

      console.log(report);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to submit report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <AlertTriangle className="text-red-500" size={28} />
        <h1 className="text-2xl font-bold">
          Report Waste Issue
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow p-6 space-y-5"
      >
        {/* Report Type */}

        <div>
          <label className="block font-medium mb-2">
            Report Type
          </label>

          <select
            className="w-full border rounded-lg p-3"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="illegal_dumping">Illegal Dumping</option>
            <option value="overflowing_bin">Overflowing Bin</option>
            <option value="missed_collection">Missed Collection</option>
            <option value="dirty_site">Dirty Site</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Description */}

        <div>
          <label className="block font-medium mb-2">
            Description
          </label>

          <textarea
            rows={5}
            className="w-full border rounded-lg p-3"
            placeholder="Describe the waste issue..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        {/* Address */}

        <div>
          <label className="block font-medium mb-2">
            Address
          </label>

          <input
            type="text"
            className="w-full border rounded-lg p-3"
            placeholder="Enter address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </div>

        {/* GPS */}

        <div>
          <button
            type="button"
            onClick={getCurrentLocation}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg"
          >
            📍 Get My Current Location
          </button>

          {locationLat && locationLng && (
            <div className="mt-3 rounded-lg bg-green-50 border border-green-200 p-3">
              <p>
                <strong>Latitude:</strong> {locationLat}
              </p>

              <p>
                <strong>Longitude:</strong> {locationLng}
              </p>
            </div>
          )}
        </div>

        {/* Photo */}

        <div>
          <label className="block font-medium mb-2">
            Upload Waste Photo
          </label>

          <input
            type="file"
            accept="image/*"
            className="w-full border rounded-lg p-3"
            onChange={(e) => {
              if (e.target.files?.length) {
                setPhoto(e.target.files[0]);
              }
            }}
          />

          {photo && (
            <div className="mt-4">
              <p className="text-green-600 text-sm mb-3">
                Selected Photo: <strong>{photo.name}</strong>
              </p>

              <img
                src={URL.createObjectURL(photo)}
                alt="Preview"
                className="w-full h-64 object-cover rounded-lg border"
              />
            </div>
          )}
        </div>

        {/* Submit */}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Report"}
        </button>
      </form>
    </div>
  );
}