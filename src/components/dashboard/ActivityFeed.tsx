import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export function ActivityFeed() {
  const [activities, setActivities] = useState<any[]>([]);

  // 1. initial fetch
  useEffect(() => {
    const fetchActivities = async () => {
      const { data } = await supabase
        .from("activities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      setActivities(data || []);
    };

    fetchActivities();
  }, []);

  // 2. REAL TIME LISTENER
  useEffect(() => {
    const channel = supabase
      .channel("activities-live")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activities",
        },
        (payload) => {
          setActivities((prev) => [
            payload.new,
            ...prev.slice(0, 9),
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="p-4 rounded-xl border">
      <h3 className="font-bold mb-3">Live Activity</h3>

      <div className="space-y-2">
        {activities.map((a) => (
          <div key={a.id} className="text-sm border-b pb-2">
            <div className="font-medium">{a.title}</div>
            <div className="text-gray-500">{a.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}