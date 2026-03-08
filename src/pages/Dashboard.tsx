import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, TrendingUp, CheckCircle, Clock, MapPin, CalendarClock, UserPlus, BarChart3, Phone, PhoneCall } from "lucide-react";
import { isToday, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

const STATUSES = ["New Lead", "Contacted", "Interested", "Site Visit Scheduled", "Negotiation", "Deal Closed", "Not Interested"] as const;
const SOURCES = ["Website", "Facebook Ads", "Google Ads", "Manual"] as const;

export default function Dashboard() {
  const { role, user } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [callsToday, setCallsToday] = useState(0);
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      let query = supabase.from("leads").select("*");
      if (role === "agent" || role === "telecaller") query = query.eq("assigned_agent", user?.id);
      const { data } = await query;
      setLeads(data || []);

      // Follow-ups
      let fuQuery = supabase.from("follow_ups").select("*").eq("status", "Pending");
      if (role === "agent" || role === "telecaller") fuQuery = fuQuery.eq("assigned_agent", user?.id);
      const { data: fuData } = await fuQuery;
      setFollowUps(fuData || []);

      if (role === "admin") {
        const { data: profilesData } = await supabase.from("profiles").select("user_id, full_name, email");
        setAgents(profilesData || []);
        setProfiles(profilesData || []);
      }

      // Telecaller: fetch calls made today
      if (role === "telecaller") {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const { count } = await supabase
          .from("call_history")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user?.id)
          .gte("call_date", todayStart.toISOString());
        setCallsToday(count || 0);
      }
    };
    if (user) fetchData();
  }, [user, role]);

  const total = leads.length;
  const closed = leads.filter((l) => l.status === "Deal Closed").length;
  const newLeads = leads.filter((l) => l.status === "New Lead").length;
  const newToday = leads.filter((l) => isToday(new Date(l.created_at))).length;
  const siteVisits = leads.filter((l) => l.status === "Site Visit Scheduled").length;
  const conversionRate = total > 0 ? ((closed / total) * 100).toFixed(1) : "0";
  const todayFollowUps = followUps.filter((f) => isToday(new Date(f.follow_up_date))).length;

  const interested = leads.filter((l) => l.status === "Interested").length;

  const telecallerCards = [
    { label: "My Leads", value: total, icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "New Leads Today", value: newToday, icon: UserPlus, color: "text-info", bg: "bg-info/10" },
    { label: "Calls Made Today", value: callsToday, icon: PhoneCall, color: "text-success", bg: "bg-success/10" },
    { label: "Follow Ups Today", value: todayFollowUps, icon: CalendarClock, color: "text-warning", bg: "bg-warning/10" },
    { label: "Interested Leads", value: interested, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
    { label: "Site Visits", value: siteVisits, icon: MapPin, color: "text-info", bg: "bg-info/10" },
  ];

  const adminAgentCards = [
    { label: "Total Leads", value: total, icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "New Today", value: newToday, icon: UserPlus, color: "text-info", bg: "bg-info/10" },
    { label: "Site Visits", value: siteVisits, icon: MapPin, color: "text-warning", bg: "bg-warning/10" },
    { label: "Deals Closed", value: closed, icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
    { label: "Conversion", value: `${conversionRate}%`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
    { label: "New Leads", value: newLeads, icon: Clock, color: "text-info", bg: "bg-info/10" },
    { label: "Follow Ups Today", value: todayFollowUps, icon: CalendarClock, color: "text-warning", bg: "bg-warning/10" },
  ];

  const summaryCards = role === "telecaller" ? telecallerCards : adminAgentCards;

  const statusCounts = STATUSES.map((s) => ({
    status: s,
    count: leads.filter((l) => l.status === s).length,
    pct: total > 0 ? ((leads.filter((l) => l.status === s).length / total) * 100).toFixed(0) : "0",
  }));

  const sourceCounts = SOURCES.map((s) => ({
    source: s,
    count: leads.filter((l) => l.source === s).length,
    pct: total > 0 ? ((leads.filter((l) => l.source === s).length / total) * 100).toFixed(0) : "0",
  }));

  const agentStats = role === "admin" ? agents.map((a) => {
    const agentLeads = leads.filter((l) => l.assigned_agent === a.user_id);
    const agentClosed = agentLeads.filter((l) => l.status === "Deal Closed").length;
    const agentVisits = agentLeads.filter((l) => l.status === "Site Visit Scheduled").length;
    return { ...a, totalLeads: agentLeads.length, closed: agentClosed, visits: agentVisits };
  }).sort((a, b) => b.closed - a.closed) : [];

  const getProfileName = (userId: string | null) => {
    if (!userId) return "Unknown";
    return profiles.find((p) => p.user_id === userId)?.full_name || "Unknown";
  };

  const recentContacted = role === "admin"
    ? leads
        .filter((l) => l.contacted_by && l.contacted_at)
        .sort((a, b) => new Date(b.contacted_at).getTime() - new Date(a.contacted_at).getTime())
        .slice(0, 10)
    : [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {role === "admin" ? "Real estate lead management overview" : role === "telecaller" ? "Your daily work summary" : "Your assigned leads overview"}
          </p>
        </div>

        {/* Summary Widgets */}
        <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 ${role !== "telecaller" ? "xl:grid-cols-7" : "xl:grid-cols-6"}`}>
          {summaryCards.map((c) => (
            <Card key={c.label}>
              <CardContent className="p-4 text-center">
                <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${c.bg} ${c.color}`}>
                  <c.icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold text-foreground">{c.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{c.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Pipeline */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Lead Pipeline</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {statusCounts.map((s) => (
                <div key={s.status} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{s.status}</span>
                    <span className="font-medium text-foreground">{s.count} ({s.pct}%)</span>
                  </div>
                  <Progress value={Number(s.pct)} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Sources */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Leads by Source</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {sourceCounts.map((s) => {
                const colors = ["bg-primary", "bg-info", "bg-warning", "bg-success"];
                const idx = SOURCES.indexOf(s.source as any);
                return (
                  <div key={s.source} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${colors[idx]}`} />
                        <span className="text-muted-foreground">{s.source}</span>
                      </div>
                      <span className="font-medium text-foreground">{s.count}</span>
                    </div>
                    <Progress value={Number(s.pct)} className="h-2" />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Leads per Agent */}
          {role === "admin" && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Leads per Agent</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {agentStats.map((a) => (
                  <div key={a.user_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                        {a.full_name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{a.full_name}</p>
                        <p className="text-xs text-muted-foreground">{a.totalLeads} leads · {a.visits} visits</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-success">{a.closed} closed</p>
                      <p className="text-xs text-muted-foreground">
                        {a.totalLeads > 0 ? ((a.closed / a.totalLeads) * 100).toFixed(0) : 0}%
                      </p>
                    </div>
                  </div>
                ))}
                {agentStats.length === 0 && <p className="text-sm text-muted-foreground">No agents yet</p>}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Contacted by Telecallers */}
        {role === "admin" && recentContacted.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Recently Contacted by Telecallers</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Lead Name</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Marked By</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentContacted.map((l) => (
                      <tr key={l.id} className="border-b last:border-0">
                        <td className="px-4 py-2 font-medium text-foreground">{l.name}</td>
                        <td className="px-4 py-2">
                          <Badge variant={l.status === "Contacted" ? "default" : "destructive"} className="text-xs">
                            {l.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">{getProfileName(l.contacted_by)}</td>
                        <td className="px-4 py-2 text-muted-foreground text-xs">
                          {formatDistanceToNow(new Date(l.contacted_at), { addSuffix: true })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
