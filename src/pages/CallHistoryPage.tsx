import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Plus, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface CallRecord {
  id: string;
  lead_id: string;
  user_id: string;
  call_date: string;
  duration: string;
  notes: string;
  created_at: string;
  lead_name?: string;
  lead_phone?: string;
}

export default function CallHistoryPage() {
  const { user } = useAuth();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [leads, setLeads] = useState<{ id: string; name: string; phone: string }[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ lead_id: "", duration: "", notes: "" });

  const fetchData = async () => {
    const [callsRes, leadsRes] = await Promise.all([
      supabase.from("call_history").select("*").eq("user_id", user?.id).order("call_date", { ascending: false }),
      supabase.from("leads").select("id, name, phone"),
    ]);
    const leadMap: Record<string, any> = {};
    (leadsRes.data || []).forEach((l) => { leadMap[l.id] = l; });
    const enriched = (callsRes.data || []).map((c: any) => ({
      ...c,
      lead_name: leadMap[c.lead_id]?.name || "Unknown",
      lead_phone: leadMap[c.lead_id]?.phone || "",
    }));
    setCalls(enriched);
    setLeads(leadsRes.data || []);
  };

  useEffect(() => { if (user) fetchData(); }, [user]);

  const handleAdd = async () => {
    if (!form.lead_id) {
      toast({ title: "Please select a lead", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("call_history").insert({
      lead_id: form.lead_id,
      user_id: user!.id,
      duration: form.duration,
      notes: form.notes,
    } as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    // Log activity
    await supabase.from("activities").insert({
      user_id: user!.id,
      lead_id: form.lead_id,
      activity_type: "Call",
      description: `Called lead${form.duration ? ` (${form.duration})` : ""}`,
    });
    toast({ title: "Call logged successfully" });
    setShowAdd(false);
    setForm({ lead_id: "", duration: "", notes: "" });
    fetchData();
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Call History</h1>
            <p className="text-sm text-muted-foreground">{calls.length} calls logged</p>
          </div>
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-1" /> Log Call
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Lead</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Phone</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Duration</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {calls.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{c.lead_name}</td>
                      <td className="px-4 py-3 text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {c.lead_phone}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{format(new Date(c.call_date), "dd MMM yyyy, hh:mm a")}</td>
                      <td className="px-4 py-3 text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {c.duration || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{c.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {calls.length === 0 && <div className="py-12 text-center text-muted-foreground">No calls logged yet.</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log a Call</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Lead</Label>
              <Select value={form.lead_id} onValueChange={(v) => setForm({ ...form, lead_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select lead" /></SelectTrigger>
                <SelectContent>
                  {leads.map((l) => <SelectItem key={l.id} value={l.id}>{l.name} – {l.phone}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duration (e.g. 2:30)</Label>
              <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="mm:ss" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Customer interested in Plot B..." />
            </div>
            <Button className="w-full" onClick={handleAdd}>Log Call</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
