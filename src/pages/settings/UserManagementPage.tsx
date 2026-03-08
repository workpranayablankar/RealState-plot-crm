import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Pencil, Plus, UserCheck, UserX, Trash2, KeyRound } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserRow {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  role: AppRole;
  is_active: boolean;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState<AppRole>("agent");
  const [saving, setSaving] = useState(false);

  // Add user state
  const [showAdd, setShowAdd] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("agent");
  const [newPassword, setNewPassword] = useState("");
  const [adding, setAdding] = useState(false);

  // Change password state
  const [passwordUser, setPasswordUser] = useState<UserRow | null>(null);
  const [newPwd, setNewPwd] = useState("");
  const [changingPwd, setChangingPwd] = useState(false);

  // Delete state
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, email, phone, is_active"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const profiles = profilesRes.data || [];
    const roles = rolesRes.data || [];
    const roleMap = new Map(roles.map((r) => [r.user_id, r.role as AppRole]));
    const merged: UserRow[] = profiles.map((p) => ({
      user_id: p.user_id,
      full_name: p.full_name,
      email: p.email,
      phone: p.phone ?? "",
      role: roleMap.get(p.user_id) || "agent",
      is_active: p.is_active ?? true,
    }));
    setUsers(merged);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const openEdit = (user: UserRow) => {
    setEditUser(user);
    setEditName(user.full_name);
    setEditPhone(user.phone);
    setEditRole(user.role);
  };

  const handleSave = async () => {
    if (!editUser) return;
    setSaving(true);
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ full_name: editName, phone: editPhone })
      .eq("user_id", editUser.user_id);
    if (profileError) {
      toast({ title: "Error updating profile", description: profileError.message, variant: "destructive" });
      setSaving(false);
      return;
    }
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

  const toggleActive = async (user: UserRow) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !user.is_active })
      .eq("user_id", user.user_id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: user.is_active ? "User deactivated" : "User activated" });
    fetchUsers();
  };

  const handleAddUser = async () => {
    if (!newEmail || !newName || !newPassword) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setAdding(true);
    const { data, error } = await supabase.functions.invoke("seed-users", {
      body: { users: [{ email: newEmail, password: newPassword, full_name: newName, role: newRole }] },
    });
    if (error) {
      toast({ title: "Error creating user", description: error.message, variant: "destructive" });
      setAdding(false);
      return;
    }
    if (newPhone) {
      await new Promise((r) => setTimeout(r, 1500));
      await supabase.from("profiles").update({ phone: newPhone }).eq("email", newEmail);
    }
    toast({ title: "User created successfully" });
    setAdding(false);
    setShowAdd(false);
    setNewEmail("");
    setNewName("");
    setNewPhone("");
    setNewPassword("");
    setNewRole("agent");
    fetchUsers();
  };

  const handleDeleteUser = async (user: UserRow) => {
    setDeleting(user.user_id);
    const { data, error } = await supabase.functions.invoke("admin-actions", {
      body: { action: "delete_user", target_user_id: user.user_id },
    });
    if (error || data?.error) {
      toast({ title: "Error deleting user", description: error?.message || data?.error, variant: "destructive" });
      setDeleting(null);
      return;
    }
    toast({ title: "User deleted successfully" });
    setDeleting(null);
    fetchUsers();
  };

  const handleChangePassword = async () => {
    if (!passwordUser || !newPwd) return;
    if (newPwd.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setChangingPwd(true);
    const { data, error } = await supabase.functions.invoke("admin-actions", {
      body: { action: "change_password", target_user_id: passwordUser.user_id, new_password: newPwd },
    });
    if (error || data?.error) {
      toast({ title: "Error changing password", description: error?.message || data?.error, variant: "destructive" });
      setChangingPwd(false);
      return;
    }
    toast({ title: "Password changed successfully" });
    setChangingPwd(false);
    setPasswordUser(null);
    setNewPwd("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">User Management</h2>
          <p className="text-sm text-muted-foreground">Manage CRM users, roles, and status</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Add User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New User</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Full Name *</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} /></div>
              <div><Label>Email *</Label><Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} /></div>
              <div><Label>Phone</Label><Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} /></div>
              <div><Label>Password *</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
              <div>
                <Label>Role</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="telecaller">Telecaller</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddUser} disabled={adding} className="w-full">
                {adding ? "Creating..." : "Create User"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={!!passwordUser} onOpenChange={(open) => { if (!open) { setPasswordUser(null); setNewPwd(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Change Password</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Change password for <span className="font-medium text-foreground">{passwordUser?.full_name}</span> ({passwordUser?.email})</p>
          <div className="space-y-4">
            <div><Label>New Password</Label><Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="Min 6 characters" /></div>
            <Button onClick={handleChangePassword} disabled={changingPwd || newPwd.length < 6} className="w-full">
              {changingPwd ? "Changing..." : "Change Password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <p className="text-muted-foreground">Loading users...</p>
      ) : (
        <div className="grid gap-3">
          {users.map((user) => (
            <Card key={user.user_id} className={!user.is_active ? "opacity-50" : ""}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {user.full_name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{user.full_name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    {user.phone && <p className="text-xs text-muted-foreground">{user.phone}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={user.is_active ? "default" : "outline"} className="text-xs">
                    {user.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"} className="capitalize">
                    {user.role}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => setPasswordUser(user)} title="Change Password">
                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => toggleActive(user)} title={user.is_active ? "Deactivate" : "Activate"}>
                    {user.is_active ? <UserX className="h-4 w-4 text-destructive" /> : <UserCheck className="h-4 w-4 text-green-600" />}
                  </Button>
                  <Dialog open={editUser?.user_id === user.user_id} onOpenChange={(open) => !open && setEditUser(null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => openEdit(user)}>
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
                      <div className="space-y-4">
                        <div><Label>Full Name</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} /></div>
                        <div><Label>Email</Label><Input value={editUser?.email || ""} disabled className="bg-muted" /></div>
                        <div><Label>Phone</Label><Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} /></div>
                        <div>
                          <Label>Role</Label>
                          <Select value={editRole} onValueChange={(v) => setEditRole(v as AppRole)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="agent">Agent</SelectItem>
                              <SelectItem value="telecaller">Telecaller</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleSave} disabled={saving} className="w-full">
                          {saving ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" title="Delete User" disabled={deleting === user.user_id}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to permanently delete <span className="font-medium">{user.full_name}</span> ({user.email})? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteUser(user)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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
