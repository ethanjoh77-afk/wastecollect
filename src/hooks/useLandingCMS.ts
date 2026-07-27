import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  getAllSections,
  type LandingContentItem,
  type LandingSection,
} from "../services/landingCmsService";

/**
 * Hook kuu ya Landing CMS — inapakua sections zote za landing_content
 * na kusikiliza mabadiliko ya live kupitia Supabase realtime,
 * ili admin kadhaa waweze kuona mabadiliko papo hapo.
 */
export function useLandingCMS() {
  const [sections, setSections] = useState<
    Record<LandingSection, LandingContentItem[]>
  >({} as Record<LandingSection, LandingContentItem[]>);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const data = await getAllSections();
      setSections(data);
    } catch (err) {
      console.error("useLandingCMS: failed to load landing_content", err);
      setError(
        err instanceof Error ? err.message : "Imeshindikana kupakia data"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const channel = supabase
      .channel("landing-cms-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "landing_content" },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  return { sections, loading, error, refresh };
}
