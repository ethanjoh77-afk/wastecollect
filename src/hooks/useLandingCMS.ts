import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useLandingCMS(section: string) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("landing_content")
        .select("*")
        .eq("section", section);

      setData(data || []);
    };

    fetch();

    // 🔥 LIVE UPDATES
    const channel = supabase
      .channel("landing-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "landing_content",
        },
        () => fetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [section]);

  return data;
}