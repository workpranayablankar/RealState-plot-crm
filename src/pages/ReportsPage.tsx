import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const SOURCES = ["Website", "Facebook Ads", "Google Ads", "Manual"];

export default function ReportsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("leads").select("*"),
      supabase.from("profiles").select("user_id, full_name"),
    ]).then(([leadsRes, profilesRes]) => {
      setLeads(leadsRes.data || []);
      setAgents(profilesRes.data || []);
    });
  }, []);

  const agentReport = agents.map((a) => {
    const al = leads.filter((l) => l.assigned_agent === a.user_id);
    const closed = al.filter((l) => l.status === "Deal Closed").length;
    return { name: a.full_name, total: al.length, closed, rate: al.length > 0 ? ((closed / al.length) * 100).toFixed(1) : "0" };
  });

  const sourceReport = SOURCES.map((s) => {
    const sl = leads.filter((l) => l.source === s);
    const closed = sl.filter((l) => l.status === "Deal Closed").length;
    return { source: s, total: sl.length, closed, rate: sl.length > 0 ? ((closed / sl.length) * 100).toFixed(1) : "0" };
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Agent Performance</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-muted-foreground font-medium">Agent</th>
                  <th className="px-4 py-3 text-left text-muted-foreground font-medium">Leads</th>
                  <th className="px-4 py-3 text-left text-muted-foreground font-medium">Closed</th>
                  <th className="px-4 py-3 text-left text-muted-foreground font-medium">Rate</th>
                </tr></thead>
                <tbody>
                  {agentReport.map((a) => (
                    <tr key={a.name} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium text-foreground">{a.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{a.total}</td>
                      <td className="px-4 py-3 text-success font-medium">{a.closed}</td>
                      <td className="px-4 py-3 text-foreground">{a.rate}%</td>
                    </tr>
                  ))}
                  {agentReport.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No data</td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>
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
        </div>
      </div>
    </AppLayout>
  );
}
