import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, UserPlus, Phone, MapPin, Handshake, FileText, Clock } from "lucide-react";
import { format } from "date-fns";

const ACTIVITY_ICONS: Record<string, any> = {
  "Lead Created": UserPlus,
  "Status Changed": FileText,
  "Agent Called": Phone,
  "Site Visit Scheduled": MapPin,
  "Deal Closed": Handshake,
};

const ACTIVITY_COLORS: Record<string, string> = {
  "Lead Created": "bg-primary/10 text-primary",
  "Status Changed": "bg-info/10 text-info",
  "Agent Called": "bg-warning/10 text-warning",
  "Site Visit Scheduled": "bg-accent text-accent-foreground",
  "Deal Closed": "bg-success/10 text-success",
};

interface ActivityItem {
  id: string;
  lead_id: string | null;
  user_id: string;
  activity_type: string;
  description: string;
  created_at: string;
  user_name?: string;
  lead_name?: string;
}

export default function ActivitiesPage() {
  const { role } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetch = async () => {
      const [actRes, profilesRes, leadsRes] = await Promise.all([
        supabase.from("activities").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("profiles").select("user_id, full_name"),
        supabase.from("leads").select("id, name"),
      ]);

      const profileMap: Record<string, string> = {};
      (profilesRes.data || []).forEach((p: any) => { profileMap[p.user_id] = p.full_name; });

      const leadMap: Record<string, string> = {};
      (leadsRes.data || []).forEach((l: any) => { leadMap[l.id] = l.name; });

      const enriched = (actRes.data || []).map((a: any) => ({
        ...a,
        user_name: profileMap[a.user_id] || "System",
        lead_name: a.lead_id ? (leadMap[a.lead_id] || "Unknown") : null,
      }));

      setActivities(enriched);
    };
    fetch();
  }, []);

  const filtered = filter === "all" ? activities : activities.filter(a => a.activity_type === filter);
  const types = [...new Set(activities.map(a => a.activity_type))];

  // Group by date
  const grouped: Record<string, ActivityItem[]> = {};
  filtered.forEach(a => {
    const day = format(new Date(a.created_at), "dd MMM yyyy");
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(a);
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Activities</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge
            className={`cursor-pointer ${filter === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
            onClick={() => setFilter("all")}
          >All</Badge>
          {types.map(t => (
            <Badge
              key={t}
              className={`cursor-pointer ${filter === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
              onClick={() => setFilter(t)}
            >{t}</Badge>
          ))}
        </div>

        {Object.keys(grouped).length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No activities recorded yet.</p>
          </div>
        )}

        {Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" /> {date}
            </p>
            <div className="space-y-2 ml-4 border-l-2 border-border pl-4">
              {items.map(a => {
                const Icon = ACTIVITY_ICONS[a.activity_type] || Activity;
                const colorClass = ACTIVITY_COLORS[a.activity_type] || "bg-muted text-muted-foreground";
                return (
                  <div key={a.id} className="flex items-start gap-3 rounded-lg border bg-card p-3">
                    <div className={`rounded-full p-2 ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{a.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {a.user_name}
                        {a.lead_name && <> · Lead: {a.lead_name}</>}
                        {" · "}
                        {format(new Date(a.created_at), "hh:mm a")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
