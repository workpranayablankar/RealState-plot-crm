import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, MapPin } from "lucide-react";

type PlotStatus = "Available" | "Booked" | "Sold";

interface Plot {
  id: string;
  plot_name: string;
  plot_no: string;
  location: string;
  price: string;
  size: string;
  status: PlotStatus;
}

const STATUS_COLORS: Record<PlotStatus, string> = {
  Available: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  Booked: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  Sold: "bg-red-500/15 text-red-700 border-red-500/30",
};

const emptyForm = { plot_name: "", plot_no: "", location: "", price: "", size: "", status: "Available" as PlotStatus };

export default function PlotSettingsPage() {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchPlots = async () => {
    setLoading(true);
    const { data } = await supabase.from("plots").select("*").order("created_at", { ascending: false });
    setPlots((data as Plot[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchPlots(); }, []);

  const openNew = () => { setForm(emptyForm); setEditId(null); setDialogOpen(true); };
  const openEdit = (p: Plot) => {
    setForm({ plot_name: p.plot_name, plot_no: p.plot_no, location: p.location, price: p.price, size: p.size, status: p.status });
    setEditId(p.id);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.plot_name) { toast({ title: "Plot name is required", variant: "destructive" }); return; }
    if (editId) {
      const { error } = await supabase.from("plots").update(form as any).eq("id", editId);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Plot updated" });
    } else {
      const { error } = await supabase.from("plots").insert(form as any);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Plot added" });
    }
    setDialogOpen(false);
    fetchPlots();
  };

  const counts = { Available: 0, Booked: 0, Sold: 0 };
  plots.forEach((p) => counts[p.status]++);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Property / Plot Management</h2>
          <p className="text-sm text-muted-foreground">{plots.length} plots total</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add Plot</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {(["Available", "Booked", "Sold"] as PlotStatus[]).map((s) => (
          <Card key={s}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">{s}</p>
                <p className="text-2xl font-bold text-foreground">{counts[s]}</p>
              </div>
              <Badge className={STATUS_COLORS[s]}>{s}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plot Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plot No</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Location</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Size</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Price</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {plots.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{p.plot_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.plot_no}</td>
                    <td className="px-4 py-3 text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{p.location}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.size}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{p.price}</td>
                    <td className="px-4 py-3"><Badge className={STATUS_COLORS[p.status]}>{p.status}</Badge></td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Edit className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {plots.length === 0 && <div className="py-12 text-center text-muted-foreground">No plots added yet.</div>}
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? "Edit Plot" : "Add Plot"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Plot Name *</Label><Input value={form.plot_name} onChange={(e) => setForm({ ...form, plot_name: e.target.value })} /></div>
            <div><Label>Plot No</Label><Input value={form.plot_no} onChange={(e) => setForm({ ...form, plot_no: e.target.value })} /></div>
            <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div><Label>Size</Label><Input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} placeholder="e.g. 1200 sq ft" /></div>
            <div><Label>Price</Label><Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="₹" /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as PlotStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Booked">Booked</SelectItem>
                  <SelectItem value="Sold">Sold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSubmit} className="w-full">{editId ? "Update" : "Add Plot"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
