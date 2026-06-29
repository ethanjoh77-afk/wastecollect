import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

export function PaymentListener() {
  useEffect(() => {
    const channel = supabase
      .channel("payment-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "payments",
        },
        (payload) => {
          const payment = payload.new as any;

          toast.success(
            `Payment received: TZS ${Number(
              payment.amount
            ).toLocaleString()}`
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return null;
}