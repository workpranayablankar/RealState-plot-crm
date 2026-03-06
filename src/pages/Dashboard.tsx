import { AppLayout } from "@/components/AppLayout";
import { useCRMStore } from "@/store/crm-store";
import { AGENTS, LEAD_STATUSES, LEAD_SOURCES } from "@/data/crm-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, TrendingUp, CheckCircle, Clock, Phone, Target } from "lucide-react";

export default function Dashboard() {
  const leads = useCRMStore((s) => s.leads);
  const total = leads.length;
  const closed = leads.filter((l) => l.status === "Deal Closed").length;
  const newLeads = leads.filter((l) => l.status === "New Lead").length;
  const contacted = leads.filter((l) => l.status === "Contacted").length;
  const conversionRate = total > 0 ? ((closed / total) * 100).toFixed(1) : "0";

  const summaryCards = [
    { label: "Total Leads", value: total, icon: Users, color: "text-primary" },
    { label: "New Leads", value: newLeads, icon: Clock, color: "text-info" },
    { label: "Deals Closed", value: closed, icon: CheckCircle, color: "text-success" },
    { label: "Conversion Rate", value: `${conversionRate}%`, icon: TrendingUp, color: "text-warning" },
  ];

  const statusCounts = LEAD_STATUSES.map((s) => ({
    status: s,
    count: leads.filter((l) => l.status === s).length,
    pct: total > 0 ? ((leads.filter((l) => l.status === s).length / total) * 100).toFixed(0) : "0",
  }));

  const sourceCounts = LEAD_SOURCES.map((s) => ({
    source: s,
    count: leads.filter((l) => l.source === s).length,
    pct: total > 0 ? ((leads.filter((l) => l.source === s).length / total) * 100).toFixed(0) : "0",
  }));

  const agentStats = AGENTS.map((a) => {
    const agentLeads = leads.filter((l) => l.assignedAgent === a.id);
    const agentClosed = agentLeads.filter((l) => l.status === "Deal Closed").length;
    return { ...a, totalLeads: agentLeads.length, closed: agentClosed };
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real estate lead management overview</p>
        </div>

        {/* Summary Cards */}
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
          {/* Lead Pipeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Lead Pipeline</CardTitle>
            </CardHeader>
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

          {/* Leads by Source */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Leads by Source</CardTitle>
            </CardHeader>
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

          {/* Agent Performance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Agent Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {agentStats.map((a) => (
                <div key={a.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                      {a.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.totalLeads} leads</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-success">{a.closed} closed</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
