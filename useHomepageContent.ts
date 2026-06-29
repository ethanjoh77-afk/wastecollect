import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useHomepageContent() {
  const [content, setContent] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("homepage_content")
        .select("*");

      if (data) {
        const mapped: Record<string, string> = {};
        data.forEach((item) => {
          mapped[item.key] = item.value;
        });

        setContent(mapped);
      }
    };

    load();
  }, []);

  return content;
}