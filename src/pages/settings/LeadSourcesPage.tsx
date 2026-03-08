import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LeadSource {
  id: string;
  label: string;
  is_active: boolean;
  sort_order: number;
}

export default function LeadSourcesPage() {
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [editItem, setEditItem] = useState<LeadSource | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("lead_sources").select("*").order("sort_order");
    setSources((data as LeadSource[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    setSaving(true);
    const maxOrder = sources.length > 0 ? Math.max(...sources.map((s) => s.sort_order)) : 0;
    const { error } = await supabase.from("lead_sources").insert({ label: newLabel.trim(), sort_order: maxOrder + 1 });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Source added" }); setNewLabel(""); setShowAdd(false); }
    setSaving(false);
    fetch();
  };

  const handleEdit = async () => {
    if (!editItem || !editLabel.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("lead_sources").update({ label: editLabel.trim() }).eq("id", editItem.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Source updated" }); setEditItem(null); }
    setSaving(false);
    fetch();
  };

  const toggleActive = async (source: LeadSource) => {
    const { error } = await supabase.from("lead_sources").update({ is_active: !source.is_active }).eq("id", source.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    fetch();
  };

  const handleDelete = async (source: LeadSource) => {
    const { error } = await supabase.from("lead_sources").delete().eq("id", source.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Source removed" });
    fetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Lead Sources</h2>
          <p className="text-sm text-muted-foreground">Manage where your leads come from for marketing analytics</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Add Source</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Lead Source</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="e.g. Instagram Ads" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
              <Button onClick={handleAdd} disabled={saving} className="w-full">{saving ? "Adding..." : "Add Source"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid gap-2">
          {sources.map((source) => (
            <Card key={source.id} className={!source.is_active ? "opacity-50" : ""}>
              <CardContent className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-foreground">{source.label}</span>
                  {!source.is_active && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={source.is_active} onCheckedChange={() => toggleActive(source)} />
                  <Dialog open={editItem?.id === source.id} onOpenChange={(open) => !open && setEditItem(null)}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => { setEditItem(source); setEditLabel(source.label); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Edit Source</DialogTitle></DialogHeader>
                      <div className="space-y-4">
                        <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} />
                        <Button onClick={handleEdit} disabled={saving} className="w-full">{saving ? "Saving..." : "Save"}</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(source)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {sources.length === 0 && <p className="text-muted-foreground">No sources configured.</p>}
        </div>
      )}
    </div>
  );
}
