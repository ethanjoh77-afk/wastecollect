import { useEffect, useState } from "react";
import {
  getComplaints,
  createComplaint,
} from "../services/complaints.service";
import type { Complaint } from "../types/complaints.types";

type NewComplaint = Omit<
  Complaint,
  "id" | "created_at" | "updated_at" | "resolved_at"
>;

export function useComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getComplaints();
      setComplaints(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function create(data: NewComplaint) {
    const newComplaint = await createComplaint(data);
    setComplaints((prev) => [newComplaint, ...prev]);
    return newComplaint;
  }

  useEffect(() => {
    load();
  }, []);

  return {
    complaints,
    loading,
    error,
    reload: load,
    createComplaint: create,
  };
}
