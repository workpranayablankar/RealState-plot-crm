import { useEffect, useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Users, Target, Download, Printer } from "lucide-react";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from "date-fns";
import { toast } from "@/hooks/use-toast";

const SOURCES = ["Website", "Facebook Ads", "Google Ads", "Manual"];
const STATUSES = ["New Lead", "Contacted", "Interested", "Site Visit Scheduled", "Negotiation", "Deal Closed", "Not Interested"];

type Period = "daily" | "monthly" | "yearly";

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csvContent = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast({ title: `${filename} downloaded` });
}

export default function ReportsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [period, setPeriod] = useState<Period>("monthly");

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

  const now = new Date();

  const periodRange = useMemo(() => {
    if (period === "daily") return { start: startOfDay(now), end: endOfDay(now), label: format(now, "dd MMM yyyy") };
    if (period === "yearly") return { start: startOfYear(now), end: endOfYear(now), label: format(now, "yyyy") };
    return { start: startOfMonth(now), end: endOfMonth(now), label: format(now, "MMMM yyyy") };
  }, [period]);

  const filteredLeads = useMemo(() =>
    leads.filter((l) => {
      const d = new Date(l.created_at);
      return d >= periodRange.start && d <= periodRange.end;
    }), [leads, periodRange]);

  const totalLeads = filteredLeads.length;
  const dealsClosed = filteredLeads.filter((l) => l.status === "Deal Closed").length;
  const conversionRate = totalLeads > 0 ? ((dealsClosed / totalLeads) * 100).toFixed(1) : "0";

  const getRoleFor = (userId: string) => roles.find((r) => r.user_id === userId)?.role || "agent";

  const buildReport = (role: string) =>
    agents
      .filter((a) => getRoleFor(a.user_id) === role)
      .map((a) => {
        const al = filteredLeads.filter((l) => l.assigned_agent === a.user_id);
        const closed = al.filter((l) => l.status === "Deal Closed").length;
        const siteVisits = al.filter((l) => l.status === "Site Visit Scheduled").length;
        return { name: a.full_name, total: al.length, closed, siteVisits, rate: al.length > 0 ? ((closed / al.length) * 100).toFixed(1) : "0" };
      })
      .sort((a, b) => b.closed - a.closed);

  const agentReport = buildReport("agent");
  const telecallerReport = buildReport("telecaller");

  const sourceReport = SOURCES.map((s) => {
    const sl = filteredLeads.filter((l) => l.source === s);
    const closed = sl.filter((l) => l.status === "Deal Closed").length;
    return { source: s, total: sl.length, closed, rate: sl.length > 0 ? ((closed / sl.length) * 100).toFixed(1) : "0" };
  });

  const funnelData = STATUSES.map((s) => ({ status: s, count: filteredLeads.filter((l) => l.status === s).length }));

  // Previous period for comparison
  const prevRange = useMemo(() => {
    if (period === "daily") {
      const prev = new Date(now);
      prev.setDate(prev.getDate() - 1);
      return { start: startOfDay(prev), end: endOfDay(prev), label: format(prev, "dd MMM yyyy") };
    }
    if (period === "yearly") {
      const prev = new Date(now);
      prev.setFullYear(prev.getFullYear() - 1);
      return { start: startOfYear(prev), end: endOfYear(prev), label: format(prev, "yyyy") };
    }
    const prev = subMonths(now, 1);
    return { start: startOfMonth(prev), end: endOfMonth(prev), label: format(prev, "MMMM yyyy") };
  }, [period]);

  const prevLeads = useMemo(() =>
    leads.filter((l) => {
      const d = new Date(l.created_at);
      return d >= prevRange.start && d <= prevRange.end;
    }), [leads, prevRange]);

  // Export functions
  const exportFullReport = () => {
    const headers = ["Name", "Phone", "Email", "Source", "Status", "Budget", "Location", "Created At"];
    const rows = filteredLeads.map((l) => [l.name, l.phone, l.email || "", l.source, l.status, l.budget || "", l.location || "", format(new Date(l.created_at), "dd/MM/yyyy")]);
    downloadCSV(`leads-report-${period}-${format(now, "yyyy-MM-dd")}.csv`, headers, rows);
  };

  const exportAgentReport = () => {
    const headers = ["Name", "Role", "Total Leads", "Site Visits", "Closed", "Conversion Rate"];
    const rows = [
      ...agentReport.map((a) => [a.name, "Agent", String(a.total), String(a.siteVisits), String(a.closed), `${a.rate}%`]),
      ...telecallerReport.map((a) => [a.name, "Telecaller", String(a.total), String(a.siteVisits), String(a.closed), `${a.rate}%`]),
    ];
    downloadCSV(`team-performance-${period}-${format(now, "yyyy-MM-dd")}.csv`, headers, rows);
  };

  const exportSourceReport = () => {
    const headers = ["Source", "Total Leads", "Closed", "Conversion Rate"];
    const rows = sourceReport.map((s) => [s.source, String(s.total), String(s.closed), `${s.rate}%`]);
    downloadCSV(`source-analysis-${period}-${format(now, "yyyy-MM-dd")}.csv`, headers, rows);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header with period tabs and export */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <div className="flex items-center gap-3">
            <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <TabsList>
                <TabsTrigger value="daily" className="text-xs">Daily</TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs">Monthly</TabsTrigger>
                <TabsTrigger value="yearly" className="text-xs">Yearly</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={exportFullReport}>
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrint}>
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">Showing data for: <span className="font-medium text-foreground">{periodRange.label}</span></p>

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
                <p className="text-2xl font-bold text-foreground">{leads.length}</p>
                <p className="text-xs text-muted-foreground">All-Time Leads</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Agent Performance */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Agent Performance</CardTitle>
              <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={exportAgentReport}>
                <Download className="h-3 w-3" /> Export
              </Button>
            </CardHeader>
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
                  {agentReport.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No agents</td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Telecaller Performance */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Telecaller Performance</CardTitle>
              <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={exportAgentReport}>
                <Download className="h-3 w-3" /> Export
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-muted-foreground font-medium">Telecaller</th>
                  <th className="px-4 py-3 text-left text-muted-foreground font-medium">Leads</th>
                  <th className="px-4 py-3 text-left text-muted-foreground font-medium">Visits</th>
                  <th className="px-4 py-3 text-left text-muted-foreground font-medium">Closed</th>
                  <th className="px-4 py-3 text-left text-muted-foreground font-medium">Rate</th>
                </tr></thead>
                <tbody>
                  {telecallerReport.map((a) => (
                    <tr key={a.name} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium text-foreground">{a.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{a.total}</td>
                      <td className="px-4 py-3 text-muted-foreground">{a.siteVisits}</td>
                      <td className="px-4 py-3 text-success font-medium">{a.closed}</td>
                      <td className="px-4 py-3 text-foreground">{a.rate}%</td>
                    </tr>
                  ))}
                  {telecallerReport.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No telecallers</td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Lead Source Analysis */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Lead Source Analysis</CardTitle>
              <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={exportSourceReport}>
                <Download className="h-3 w-3" /> Export
              </Button>
            </CardHeader>
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
          <Card>
            <CardHeader><CardTitle className="text-base">Conversion Funnel</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {funnelData.map((f) => {
                  const pct = totalLeads > 0 ? (f.count / totalLeads) * 100 : 0;
                  return (
                    <div key={f.status} className="flex items-center gap-3">
                      <span className="text-sm text-foreground w-40 shrink-0">{f.status}</span>
                      <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.max(pct, 2)}%` }} />
                      </div>
                      <span className="text-sm font-medium text-foreground w-12 text-right">{f.count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Period Comparison */}
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Period Comparison</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2 text-center rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">{prevRange.label}</p>
                  <p className="text-3xl font-bold text-foreground">{prevLeads.length}</p>
                  <p className="text-xs text-muted-foreground">leads · {prevLeads.filter((l) => l.status === "Deal Closed").length} closed</p>
                </div>
                <div className="space-y-2 text-center rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <p className="text-sm text-muted-foreground">{periodRange.label}</p>
                  <p className="text-3xl font-bold text-foreground">{filteredLeads.length}</p>
                  <p className="text-xs text-muted-foreground">leads · {dealsClosed} closed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
