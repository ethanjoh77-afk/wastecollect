export type ComplaintStatus = "open" | "in_progress" | "resolved";

export type ComplaintPriority = "low" | "medium" | "high";

export interface Complaint {
  id: string;

  citizen_id: string;

  complaint_type: string;

  subject: string;
  description: string;

  status: ComplaintStatus;
  priority: ComplaintPriority;

  assigned_to?: string | null;
  municipality_id?: string | null;

  attachments?: string | null;
  resolution?: string | null;

  resolved_at?: string | null;

  created_at: string;
  updated_at?: string | null;
}