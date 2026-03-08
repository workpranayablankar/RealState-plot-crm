import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

const permissions = [
  { label: "View all leads", admin: true, agent: false },
  { label: "View assigned leads", admin: true, agent: true },
  { label: "Add new leads", admin: true, agent: false },
  { label: "Update lead status", admin: true, agent: true },
  { label: "Assign leads to agents", admin: true, agent: false },
  { label: "Add notes to leads", admin: true, agent: true },
  { label: "Schedule follow-ups", admin: true, agent: true },
  { label: "View all follow-ups", admin: true, agent: false },
  { label: "View reports", admin: true, agent: false },
  { label: "Manage agents / users", admin: true, agent: false },
  { label: "Manage plots", admin: true, agent: false },
  { label: "View plots", admin: true, agent: true },
  { label: "Edit settings", admin: true, agent: false },
  { label: "View notifications", admin: true, agent: true },
];

function Check({ allowed }: { allowed: boolean }) {
  return allowed ? (
    <CheckCircle2 className="h-5 w-5 text-green-500" />
  ) : (
    <XCircle className="h-5 w-5 text-muted-foreground/40" />
  );
}

export default function RolesPermissionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Roles & Permissions</h2>
        <p className="text-sm text-muted-foreground">Overview of access control for each role</p>
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
              </tr>
            </thead>
            <tbody>
              {permissions.map((p, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-foreground">{p.label}</td>
                  <td className="px-4 py-3 text-center"><Check allowed={p.admin} /></td>
                  <td className="px-4 py-3 text-center"><Check allowed={p.agent} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
