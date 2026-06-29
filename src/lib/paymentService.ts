import { supabase } from "./supabase";
import { createActivity } from "./activityService";

interface CreatePaymentInput {
  user_id: string;
  amount: number;
  payment_method:
    | "mpesa"
    | "airtel_money"
    | "tigo_pesa"
    | "halopesa"
    | "card"
    | "bank_transfer";
}

export async function createPayment(data: CreatePaymentInput) {
  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("AUTH USER:", user?.id);
  console.log("PAYMENT USER:", data.user_id);

  const transactionRef = `TXN-${Date.now()}`;
  const receiptNumber = `RCT-${Date.now()}`;

  // Create payment
  const { data: payment, error } = await supabase
    .from("payments")
    .insert({
      user_id: data.user_id,
      citizen_id: data.user_id,
      amount: data.amount,
      payment_method: data.payment_method,
      payment_type: "subscription",
      status: "pending",
      transaction_ref: transactionRef,
      receipt_number: receiptNumber,
    })
    .select()
    .single();

  if (error) {
    console.error("PAYMENT ERROR:", error);
    throw error;
  }

  // Create activity
  await createActivity({
    type: "payment",
    title: "Payment Submitted",
    description: `TZS ${Number(data.amount).toLocaleString()} via ${data.payment_method}`,
    user_id: data.user_id,
    role: "citizen",
  });

  return payment;
}

export async function getUserPayments(userId: string) {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("GET PAYMENTS ERROR:", error);
    throw error;
  }

  return data ?? [];
}