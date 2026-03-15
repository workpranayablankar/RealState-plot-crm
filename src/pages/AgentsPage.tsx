import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function AgentsPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("profiles").select("user_id, full_name, email"),
      supabase.from("leads").select("assigned_agent, status"),
      supabase.from("user_roles").select("user_id, role"),
    ]).then(([profilesRes, leadsRes, rolesRes]) => {
      setProfiles(profilesRes.data || []);
      setLeads(leadsRes.data || []);
      setRoles(rolesRes.data || []);
    });
  }, []);

  const roleMap = new Map(roles.map((r) => [r.user_id, r.role]));

  const buildStats = (list: any[]) =>
    list.map((a) => {
      const agentLeads = leads.filter((l) => l.assigned_agent === a.user_id);
      const closed = agentLeads.filter((l) => l.status === "Deal Closed").length;
      const contacted = agentLeads.filter((l) => l.status !== "New Lead").length;
      const total = agentLeads.length;
      const conversion = total > 0 ? ((closed / total) * 100).toFixed(1) : "0";
      return { ...a, total, closed, contacted, conversion };
    });

  const agentProfiles = profiles.filter((p) => roleMap.get(p.user_id) === "agent");
  const telecallerProfiles = profiles.filter((p) => roleMap.get(p.user_id) === "telecaller");

  const agentStats = buildStats(agentProfiles);
  const telecallerStats = buildStats(telecallerProfiles);

  const renderCards = (items: any[], emptyMsg: string) => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((a) => (
        <Card key={a.user_id}>
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full bg-primary text-xs sm:text-sm font-bold text-primary-foreground">
                {a.full_name?.split(" ").map((n: string) => n[0]).join("") || "?"}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-sm sm:text-base truncate">{a.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{a.email}</p>
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
                <span>Contacted</span><span>{a.contacted}/{a.total}</span>
              </div>
              <Progress value={a.total > 0 ? (a.contacted / a.total) * 100 : 0} className="h-2" />
            </div>
          </CardContent>
        </Card>
      ))}
      {items.length === 0 && <p className="text-muted-foreground col-span-full">{emptyMsg}</p>}
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Agents</h1>
          {renderCards(agentStats, "No agents registered yet.")}
        </div>

        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Telecallers</h1>
          {renderCards(telecallerStats, "No telecallers registered yet.")}
        </div>
      </div>
    </AppLayout>
  );
}
