import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Users, Target } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

const SOURCES = ["Website", "Facebook Ads", "Google Ads", "Manual"];
const STATUSES = ["New Lead", "Contacted", "Interested", "Site Visit Scheduled", "Negotiation", "Deal Closed", "Not Interested"];

export default function ReportsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("leads").select("*"),
      supabase.from("profiles").select("user_id, full_name"),
      supabase.from("user_roles").select("user_id, role"),
    ]).then(([leadsRes, profilesRes, rolesRes]) => {
      setLeads(leadsRes.data || []);
      setAgents(profilesRes.data || []);
      setRoles(rolesRes.data || []);
    });
  }, []);

  const totalLeads = leads.length;
  const dealsClosed = leads.filter(l => l.status === "Deal Closed").length;
  const conversionRate = totalLeads > 0 ? ((dealsClosed / totalLeads) * 100).toFixed(1) : "0";

  // Current month leads
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const thisMonthLeads = leads.filter(l => {
    const d = new Date(l.created_at);
    return d >= monthStart && d <= monthEnd;
  });
  const lastMonthLeads = leads.filter(l => {
    const d = new Date(l.created_at);
    const lmStart = startOfMonth(subMonths(now, 1));
    const lmEnd = endOfMonth(subMonths(now, 1));
    return d >= lmStart && d <= lmEnd;
  });

  // Agent performance
  const agentReport = agents.map((a) => {
    const al = leads.filter((l) => l.assigned_agent === a.user_id);
    const closed = al.filter((l) => l.status === "Deal Closed").length;
    const siteVisits = al.filter((l) => l.status === "Site Visit Scheduled").length;
    return {
      name: a.full_name,
      total: al.length,
      closed,
      siteVisits,
      rate: al.length > 0 ? ((closed / al.length) * 100).toFixed(1) : "0",
    };
  }).sort((a, b) => b.closed - a.closed);

  // Source report
  const sourceReport = SOURCES.map((s) => {
    const sl = leads.filter((l) => l.source === s);
    const closed = sl.filter((l) => l.status === "Deal Closed").length;
    return { source: s, total: sl.length, closed, rate: sl.length > 0 ? ((closed / sl.length) * 100).toFixed(1) : "0" };
  });

  // Conversion funnel
  const funnelData = STATUSES.map(s => ({
    status: s,
    count: leads.filter(l => l.status === s).length,
  }));

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2"><Users className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalLeads}</p>
                <p className="text-xs text-muted-foreground">Total Leads</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-full bg-success/10 p-2"><Target className="h-5 w-5 text-success" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{dealsClosed}</p>
                <p className="text-xs text-muted-foreground">Deals Closed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-full bg-warning/10 p-2"><TrendingUp className="h-5 w-5 text-warning" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{conversionRate}%</p>
                <p className="text-xs text-muted-foreground">Conversion Rate</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-full bg-info/10 p-2"><BarChart3 className="h-5 w-5 text-info" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{thisMonthLeads.length}</p>
                <p className="text-xs text-muted-foreground">This Month</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Agent Performance */}
          <Card>
            <CardHeader><CardTitle className="text-base">Agent Performance</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-muted-foreground font-medium">Agent</th>
                  <th className="px-4 py-3 text-left text-muted-foreground font-medium">Leads</th>
                  <th className="px-4 py-3 text-left text-muted-foreground font-medium">Visits</th>
                  <th className="px-4 py-3 text-left text-muted-foreground font-medium">Closed</th>
                  <th className="px-4 py-3 text-left text-muted-foreground font-medium">Rate</th>
                </tr></thead>
                <tbody>
                  {agentReport.map((a) => (
                    <tr key={a.name} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium text-foreground">{a.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{a.total}</td>
                      <td className="px-4 py-3 text-muted-foreground">{a.siteVisits}</td>
                      <td className="px-4 py-3 text-success font-medium">{a.closed}</td>
                      <td className="px-4 py-3 text-foreground">{a.rate}%</td>
                    </tr>
                  ))}
                  {agentReport.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No data</td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Lead Source Analysis */}
          <Card>
            <CardHeader><CardTitle className="text-base">Lead Source Analysis</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-muted-foreground font-medium">Source</th>
                  <th className="px-4 py-3 text-left text-muted-foreground font-medium">Leads</th>
                  <th className="px-4 py-3 text-left text-muted-foreground font-medium">Closed</th>
                  <th className="px-4 py-3 text-left text-muted-foreground font-medium">Conv.</th>
                </tr></thead>
                <tbody>
                  {sourceReport.map((s) => (
                    <tr key={s.source} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium text-foreground">{s.source}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.total}</td>
                      <td className="px-4 py-3 text-success font-medium">{s.closed}</td>
                      <td className="px-4 py-3 text-foreground">{s.rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Conversion Funnel */}
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Conversion Funnel</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {funnelData.map((f) => {
                  const pct = totalLeads > 0 ? (f.count / totalLeads) * 100 : 0;
                  return (
                    <div key={f.status} className="flex items-center gap-3">
                      <span className="text-sm text-foreground w-40 shrink-0">{f.status}</span>
                      <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-foreground w-12 text-right">{f.count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Report */}
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Monthly Comparison</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2 text-center rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">{format(subMonths(now, 1), "MMMM yyyy")}</p>
                  <p className="text-3xl font-bold text-foreground">{lastMonthLeads.length}</p>
                  <p className="text-xs text-muted-foreground">leads · {lastMonthLeads.filter(l => l.status === "Deal Closed").length} closed</p>
                </div>
                <div className="space-y-2 text-center rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <p className="text-sm text-muted-foreground">{format(now, "MMMM yyyy")}</p>
                  <p className="text-3xl font-bold text-foreground">{thisMonthLeads.length}</p>
                  <p className="text-xs text-muted-foreground">leads · {thisMonthLeads.filter(l => l.status === "Deal Closed").length} closed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
