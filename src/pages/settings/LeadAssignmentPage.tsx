import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { RefreshCw, UserPlus, Users } from "lucide-react";

interface Agent {
  user_id: string;
  full_name: string;
  email: string;
}

export default function LeadAssignmentPage() {
  const [method, setMethod] = useState<string>("manual");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const [settingsRes, profilesRes, rolesRes] = await Promise.all([
        supabase.from("assignment_settings").select("*").limit(1),
        supabase.from("profiles").select("user_id, full_name, email"),
        supabase.from("user_roles").select("user_id, role"),
      ]);

      if (settingsRes.data?.[0]) {
        setMethod(settingsRes.data[0].method);
        setSettingsId(settingsRes.data[0].id);
      }

      const roles = rolesRes.data || [];
      const agentIds = new Set(roles.filter((r) => r.role === "agent").map((r) => r.user_id));
      const profiles = (profilesRes.data || []).filter((p) => agentIds.has(p.user_id));
      setAgents(profiles);
      setLoading(false);
    };
    init();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    if (settingsId) {
      const { error } = await supabase.from("assignment_settings").update({ method }).eq("id", settingsId);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setSaving(false); return; }
    }
    toast({ title: "Assignment rule updated" });
    setSaving(false);
  };

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Lead Assignment Rules</h2>
        <p className="text-sm text-muted-foreground">Configure how new leads are distributed to agents</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Assignment Method</CardTitle></CardHeader>
        <CardContent>
          <RadioGroup value={method} onValueChange={setMethod} className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border p-4 hover:bg-muted/30 transition-colors">
              <RadioGroupItem value="round_robin" id="round_robin" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="round_robin" className="text-sm font-medium text-foreground cursor-pointer flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-primary" /> Round Robin
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Leads are distributed evenly across agents in rotation.
                </p>
                <div className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded p-2 font-mono">
                  Lead 1 → Agent 1 &nbsp;•&nbsp; Lead 2 → Agent 2 &nbsp;•&nbsp; Lead 3 → Agent 3 &nbsp;•&nbsp; ...
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border p-4 hover:bg-muted/30 transition-colors">
              <RadioGroupItem value="manual" id="manual" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="manual" className="text-sm font-medium text-foreground cursor-pointer flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-primary" /> Manual Assignment
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Admin manually assigns each lead to a specific agent.
                </p>
              </div>
            </div>
          </RadioGroup>

          <Button onClick={handleSave} disabled={saving} className="mt-6">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> Active Agents ({agents.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {agents.map((agent, i) => (
              <div key={agent.user_id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {agent.full_name?.charAt(0) || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{agent.full_name}</p>
                  <p className="text-xs text-muted-foreground">{agent.email}</p>
                </div>
                {method === "round_robin" && (
                  <span className="text-xs text-muted-foreground">Position {i + 1}</span>
                )}
              </div>
            ))}
            {agents.length === 0 && (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">No agents found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
