import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, GripVertical, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LeadStatus {
  id: string;
  label: string;
  sort_order: number;
  is_default: boolean;
}

export default function LeadStatusSetupPage() {
  const [statuses, setStatuses] = useState<LeadStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [editItem, setEditItem] = useState<LeadStatus | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchStatuses = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("lead_statuses")
      .select("*")
      .order("sort_order", { ascending: true });
    setStatuses(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchStatuses(); }, []);

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    setSaving(true);
    const maxOrder = statuses.length > 0 ? Math.max(...statuses.map((s) => s.sort_order)) : 0;
    const { error } = await supabase.from("lead_statuses").insert({
      label: newLabel.trim(),
      sort_order: maxOrder + 1,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Status added" });
      setNewLabel("");
      setShowAdd(false);
    }
    setSaving(false);
    fetchStatuses();
  };

  const handleEdit = async () => {
    if (!editItem || !editLabel.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("lead_statuses")
      .update({ label: editLabel.trim() })
      .eq("id", editItem.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Status updated" });
      setEditItem(null);
    }
    setSaving(false);
    fetchStatuses();
  };

  const handleDelete = async (status: LeadStatus) => {
    if (status.is_default) {
      toast({ title: "Cannot delete default status", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("lead_statuses").delete().eq("id", status.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Status removed" });
    }
    fetchStatuses();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Lead Status Setup</h2>
          <p className="text-sm text-muted-foreground">Customize your sales pipeline stages</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Add Status</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Status</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Status label, e.g. Follow Up Later" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
              <Button onClick={handleAdd} disabled={saving} className="w-full">
                {saving ? "Adding..." : "Add Status"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid gap-2">
          {statuses.map((status, i) => (
            <Card key={status.id}>
              <CardContent className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">{status.label}</span>
                  {status.is_default && <Badge variant="outline" className="text-xs">Default</Badge>}
                </div>
                <div className="flex items-center gap-1">
                  <Dialog open={editItem?.id === status.id} onOpenChange={(open) => !open && setEditItem(null)}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => { setEditItem(status); setEditLabel(status.label); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Edit Status</DialogTitle></DialogHeader>
                      <div className="space-y-4">
                        <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} />
                        <Button onClick={handleEdit} disabled={saving} className="w-full">
                          {saving ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  {!status.is_default && (
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(status)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
