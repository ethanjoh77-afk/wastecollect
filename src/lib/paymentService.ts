import { supabase } from "./supabase";

export type ActivityType =
  | "report"
  | "payment"
  | "collection"
  | "alert"
  | "success";

export interface CreateActivityInput {
  type: ActivityType;
  title: string;
  description: string;
  user_id?: string;
  role?: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  user_id?: string;
  role?: string;
  created_at: string;
}

/**
 * Create a new activity log (REAL Supabase insert)
 */
export async function createActivity(payload: CreateActivityInput) {
  const { data, error } = await supabase
    .from("activities")
    .insert({
      ...payload,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Activity log failed:", error.message);
    return null;
  }

  return data;
}

/**
 * Fetch latest activities
 */
export async function getActivities(limit = 10): Promise<Activity[]> {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Fetch activities failed:", error.message);
    return [];
  }

  return data || [];
}

/* ================= PAYMENTS ================= */

export type PaymentMethod =
  | "mpesa"
  | "airtel_money"
  | "tigo_pesa"
  | "halopesa"
  | "card"
  | "bank_transfer";

export interface CreatePaymentInput {
  user_id: string;
  amount: number;
  payment_method: PaymentMethod;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  payment_method: PaymentMethod;
  status: "pending" | "completed" | "failed" | "refunded";
  created_at: string;
}

/**
 * Create a new payment record (REAL Supabase insert).
 * Status inaanza kama "pending" kila wakati — hakuna uthibitisho wa
 * kiotomatiki wa malipo bado (hakuna payment gateway iliyounganishwa).
 * Ona maelezo ya awali kuhusu hitaji la Edge Function / webhook.
 */
export async function createPayment(
  input: CreatePaymentInput
): Promise<Payment> {
  const { data, error } = await supabase
    .from("payments")
    .insert({
      user_id: input.user_id,
      amount: input.amount,
      payment_method: input.payment_method,
      status: "pending",
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // Log activity (best-effort, isizuie malipo kama activity log ikishindwa)
  await createActivity({
    type: "payment",
    title: "Ombi la malipo limesajiliwa",
    description: `TZS ${input.amount.toLocaleString()} kupitia ${input.payment_method}`,
    user_id: input.user_id,
  });

  return data as Payment;
}

/**
 * Fetch payments for a specific user
 */
export async function getUserPayments(userId: string): Promise<Payment[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch payments failed:", error.message);
    return [];
  }

  return data || [];
}