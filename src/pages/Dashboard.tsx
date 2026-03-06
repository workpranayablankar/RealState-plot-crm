import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, TrendingUp, CheckCircle, Clock } from "lucide-react";

const STATUSES = ["New Lead", "Contacted", "Interested", "Site Visit Scheduled", "Negotiation", "Deal Closed", "Not Interested"] as const;
const SOURCES = ["Website", "Facebook Ads", "Google Ads", "Manual"] as const;

export default function Dashboard() {
  const { role, user } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      let query = supabase.from("leads").select("*");
      if (role === "agent") query = query.eq("assigned_agent", user?.id);
      const { data } = await query;
      setLeads(data || []);

      if (role === "admin") {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, email");
        setAgents(profiles || []);
      }
    };
    if (user) fetchData();
  }, [user, role]);

  const total = leads.length;
  const closed = leads.filter((l) => l.status === "Deal Closed").length;
  const newLeads = leads.filter((l) => l.status === "New Lead").length;
  const conversionRate = total > 0 ? ((closed / total) * 100).toFixed(1) : "0";

  const summaryCards = [
    { label: "Total Leads", value: total, icon: Users, color: "text-primary" },
    { label: "New Leads", value: newLeads, icon: Clock, color: "text-info" },
    { label: "Deals Closed", value: closed, icon: CheckCircle, color: "text-success" },
    { label: "Conversion Rate", value: `${conversionRate}%`, icon: TrendingUp, color: "text-warning" },
  ];

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
    return { ...a, totalLeads: agentLeads.length, closed: agentClosed };
  }) : [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {role === "admin" ? "Real estate lead management overview" : "Your assigned leads overview"}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((c) => (
            <Card key={c.label}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-secondary ${c.color}`}>
                  <c.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                  <p className="text-2xl font-bold text-foreground">{c.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Leads by Source</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {sourceCounts.map((s) => (
                <div key={s.source} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{s.source}</span>
                    <span className="font-medium text-foreground">{s.count} ({s.pct}%)</span>
                  </div>
                  <Progress value={Number(s.pct)} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {role === "admin" && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Agent Performance</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {agentStats.map((a) => (
                  <div key={a.user_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                        {a.full_name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{a.full_name}</p>
                        <p className="text-xs text-muted-foreground">{a.totalLeads} leads</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-success">{a.closed} closed</p>
                  </div>
                ))}
                {agentStats.length === 0 && <p className="text-sm text-muted-foreground">No agents yet</p>}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
