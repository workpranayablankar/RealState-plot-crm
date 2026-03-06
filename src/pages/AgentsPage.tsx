import { AppLayout } from "@/components/AppLayout";
import { useCRMStore } from "@/store/crm-store";
import { AGENTS } from "@/data/crm-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function AgentsPage() {
  const leads = useCRMStore((s) => s.leads);

  const agentStats = AGENTS.map((a) => {
    const agentLeads = leads.filter((l) => l.assignedAgent === a.id);
    const closed = agentLeads.filter((l) => l.status === "Deal Closed").length;
    const contacted = agentLeads.filter((l) => l.status !== "New Lead").length;
    const conversion = agentLeads.length > 0 ? ((closed / agentLeads.length) * 100).toFixed(1) : "0";
    return { ...a, total: agentLeads.length, closed, contacted, conversion };
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Agents</h1>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {agentStats.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {a.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-secondary p-2">
                    <p className="text-lg font-bold text-foreground">{a.total}</p>
                    <p className="text-xs text-muted-foreground">Leads</p>
                  </div>
                  <div className="rounded-lg bg-secondary p-2">
                    <p className="text-lg font-bold text-success">{a.closed}</p>
                    <p className="text-xs text-muted-foreground">Closed</p>
                  </div>
                  <div className="rounded-lg bg-secondary p-2">
                    <p className="text-lg font-bold text-foreground">{a.conversion}%</p>
                    <p className="text-xs text-muted-foreground">Conv.</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Contacted</span>
                    <span>{a.contacted}/{a.total}</span>
                  </div>
                  <Progress value={a.total > 0 ? (a.contacted / a.total) * 100 : 0} className="h-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
