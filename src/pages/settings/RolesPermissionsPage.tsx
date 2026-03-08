import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CheckCircle2, XCircle, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Permission {
  label: string;
  key: string;
  admin: boolean;
  agent: boolean;
  telecaller: boolean;
}

const defaultPermissions: Permission[] = [
  { key: "view_all_leads", label: "View all leads", admin: true, agent: false, telecaller: false },
  { key: "view_assigned_leads", label: "View assigned leads", admin: true, agent: true, telecaller: true },
  { key: "add_leads", label: "Add new leads", admin: true, agent: true, telecaller: true },
  { key: "update_lead_status", label: "Update lead status", admin: true, agent: true, telecaller: true },
  { key: "assign_leads", label: "Assign leads to agents", admin: true, agent: false, telecaller: false },
  { key: "add_notes", label: "Add notes to leads", admin: true, agent: true, telecaller: true },
  { key: "schedule_followups", label: "Schedule follow-ups", admin: true, agent: true, telecaller: true },
  { key: "view_all_followups", label: "View all follow-ups", admin: true, agent: false, telecaller: false },
  { key: "view_reports", label: "View reports", admin: true, agent: false, telecaller: false },
  { key: "manage_users", label: "Manage agents / users", admin: true, agent: false, telecaller: false },
  { key: "manage_plots", label: "Manage plots", admin: true, agent: false, telecaller: false },
  { key: "view_plots", label: "View plots", admin: true, agent: true, telecaller: true },
  { key: "edit_settings", label: "Edit settings", admin: true, agent: false, telecaller: false },
  { key: "view_notifications", label: "View notifications", admin: true, agent: true, telecaller: true },
  { key: "delete_leads", label: "Delete leads", admin: true, agent: false, telecaller: false },
  { key: "export_data", label: "Export data", admin: true, agent: false, telecaller: false },
  { key: "log_calls", label: "Log calls", admin: true, agent: true, telecaller: true },
];

const STORAGE_KEY = "crm_role_permissions";

export default function RolesPermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>(defaultPermissions);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load saved permissions from system_preferences or localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Permission[];
        // Merge with defaults to pick up new permissions
        const merged = defaultPermissions.map((dp) => {
          const found = parsed.find((p) => p.key === dp.key);
          return found ? { ...dp, agent: found.agent, telecaller: found.telecaller } : dp;
        });
        setPermissions(merged);
      } catch { /* use defaults */ }
    }
  }, []);

  const togglePerm = (key: string, role: "agent" | "telecaller") => {
    setPermissions((prev) =>
      prev.map((p) => (p.key === key ? { ...p, [role]: !p[role] } : p))
    );
  };

  const handleSave = () => {
    setSaving(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(permissions));
    toast({ title: "Permissions saved successfully" });
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Permission[];
        const merged = defaultPermissions.map((dp) => {
          const found = parsed.find((p) => p.key === dp.key);
          return found ? { ...dp, agent: found.agent, telecaller: found.telecaller } : dp;
        });
        setPermissions(merged);
      } catch {
        setPermissions(defaultPermissions);
      }
    } else {
      setPermissions(defaultPermissions);
    }
    setEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Roles & Permissions</h2>
          <p className="text-sm text-muted-foreground">Configure access control for each role</p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
              <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={saving}>
                <Save className="h-3.5 w-3.5" /> Save
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => setEditing(true)}>Edit Permissions</Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-foreground">Permission</th>
                <th className="px-4 py-3 text-center font-medium text-foreground">
                  <Badge variant="default">Admin</Badge>
                </th>
                <th className="px-4 py-3 text-center font-medium text-foreground">
                  <Badge variant="secondary">Agent</Badge>
                </th>
                <th className="px-4 py-3 text-center font-medium text-foreground">
                  <Badge variant="outline">Telecaller</Badge>
                </th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((p) => (
                <tr key={p.key} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-foreground">{p.label}</td>
                  <td className="px-4 py-3 text-center">
                    <CheckCircle2 className="h-5 w-5 text-success mx-auto" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editing ? (
                      <Switch checked={p.agent} onCheckedChange={() => togglePerm(p.key, "agent")} />
                    ) : p.agent ? (
                      <CheckCircle2 className="h-5 w-5 text-success mx-auto" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground/40 mx-auto" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editing ? (
                      <Switch checked={p.telecaller} onCheckedChange={() => togglePerm(p.key, "telecaller")} />
                    ) : p.telecaller ? (
                      <CheckCircle2 className="h-5 w-5 text-success mx-auto" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground/40 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
