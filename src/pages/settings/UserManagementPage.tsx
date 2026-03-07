import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserRow {
  user_id: string;
  full_name: string;
  email: string;
  role: AppRole;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<AppRole>("agent");
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, email"),
      supabase.from("user_roles").select("user_id, role"),
    ]);

    const profiles = profilesRes.data || [];
    const roles = rolesRes.data || [];
    const roleMap = new Map(roles.map((r) => [r.user_id, r.role as AppRole]));

    const merged: UserRow[] = profiles.map((p) => ({
      user_id: p.user_id,
      full_name: p.full_name,
      email: p.email,
      role: roleMap.get(p.user_id) || "agent",
    }));

    setUsers(merged);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const openEdit = (user: UserRow) => {
    setEditUser(user);
    setEditName(user.full_name);
    setEditRole(user.role);
  };

  const handleSave = async () => {
    if (!editUser) return;
    setSaving(true);

    // Update profile name
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ full_name: editName })
      .eq("user_id", editUser.user_id);

    if (profileError) {
      toast({ title: "Error updating profile", description: profileError.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    // Update role if changed
    if (editRole !== editUser.role) {
      const { error: roleError } = await supabase
        .from("user_roles")
        .update({ role: editRole })
        .eq("user_id", editUser.user_id);

      if (roleError) {
        toast({ title: "Error updating role", description: roleError.message, variant: "destructive" });
        setSaving(false);
        return;
      }
    }

    toast({ title: "User updated successfully" });
    setSaving(false);
    setEditUser(null);
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">User Management</h2>
          <p className="text-sm text-muted-foreground">Manage CRM users and their roles</p>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading users...</p>
      ) : (
        <div className="grid gap-4">
          {users.map((user) => (
            <Card key={user.user_id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {user.full_name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{user.full_name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={user.role === "admin" ? "default" : "secondary"} className="capitalize">
                    {user.role}
                  </Badge>
                  <Dialog open={editUser?.user_id === user.user_id} onOpenChange={(open) => !open && setEditUser(null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => openEdit(user)}>
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Full Name</Label>
                          <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input value={editUser?.email || ""} disabled className="bg-muted" />
                        </div>
                        <div>
                          <Label>Role</Label>
                          <Select value={editRole} onValueChange={(v) => setEditRole(v as AppRole)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="agent">Agent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleSave} disabled={saving} className="w-full">
                          {saving ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
          {users.length === 0 && <p className="text-muted-foreground">No users found.</p>}
        </div>
      )}
    </div>
  );
}
