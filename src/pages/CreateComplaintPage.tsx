import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useComplaints } from "../hooks/useComplaints";
import { Input } from "../components/common/Input";
import { Select } from "../components/common/Select";
import { Textarea } from "../components/common/Textarea";

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
      const { data: userData, error: userError } = await supabase.auth.getUser();

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

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4 text-secondary-900 dark:text-white">
        Create Complaint
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          required
        />

        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          required
        />

        <Input
          value={complaintType}
          onChange={(e) => setComplaintType(e.target.value)}
          placeholder="Complaint Type"
          required
        />

        <Select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          placeholder="Priority"
          required
          options={[
            { value: "low", label: "Low" },
            { value: "medium", label: "Medium" },
            { value: "high", label: "High" },
          ]}
        />

        {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
        {success && <p className="text-green-600 dark:text-green-400">{success}</p>}

        <button
          disabled={loading}
          className="bg-slate-900 dark:bg-primary-600 hover:bg-slate-800 dark:hover:bg-primary-700 text-white p-3 w-full rounded-lg"
        >
          {loading ? "Saving..." : "Submit"}
        </button>
      </form>
    </div>
  );
}