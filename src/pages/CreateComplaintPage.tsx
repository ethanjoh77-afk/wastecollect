import { useState } from "react";
import { useComplaints } from "../hooks/useComplaints";

export default function CreateComplaintPage() {
  const { createComplaint } = useComplaints();

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [complaintType, setComplaintType] = useState("");
  const [priority, setPriority] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();

  setLoading(true);
  setError(null);
  setSuccess(null);

  try {
    // 1. GET AUTH USER
    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError) throw userError;

    const userId = userData?.user?.id;

    if (!userId) {
      throw new Error("User not authenticated");
    }

    // 2. INSERT COMPLAINT
    const { error } = await supabase.from("complaints").insert({
      subject,
      description,
      complaint_type: complaintType,
      priority,
      status: "open",
      citizen_id: userId,
    });

    if (error) throw error;

    setSuccess("Complaint created successfully");

    setSubject("");
    setDescription("");
    setComplaintType("");
    setPriority("");
  } catch (err: any) {
    setError(err.message || "Failed to create complaint");
  } finally {
    setLoading(false);
  }
}

      setSuccess("Complaint created successfully");

      setSubject("");
      setDescription("");
      setComplaintType("");
      setPriority("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">
        Create Complaint
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">

        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          className="border p-3 w-full"
          required
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="border p-3 w-full"
          required
        />

        <input
          value={complaintType}
          onChange={(e) => setComplaintType(e.target.value)}
          placeholder="Complaint Type"
          className="border p-3 w-full"
          required
        />

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="border p-3 w-full"
          required
        >
          <option value="">Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        {error && <p className="text-red-600">{error}</p>}
        {success && <p className="text-green-600">{success}</p>}

        <button
          disabled={loading}
          className="bg-black text-white p-3 w-full"
        >
          {loading ? "Saving..." : "Submit"}
        </button>

      </form>
    </div>
  );
}