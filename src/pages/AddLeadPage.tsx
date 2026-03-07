import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const SOURCES = ["Website", "Facebook Ads", "Google Ads", "Manual"] as const;

export default function AddLeadPage() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [agents, setAgents] = useState<{ user_id: string; full_name: string }[]>([]);
  const [plots, setPlots] = useState<{ id: string; plot_name: string; plot_no: string }[]>([]);
  const [form, setForm] = useState({
    name: "", phone: "", email: "", location: "", budget: "",
    property_interest: "", source: "" as typeof SOURCES[number] | "",
    assigned_agent: "", notes: "", interested_plot: "",
  });

  useEffect(() => {
    supabase.from("plots").select("id, plot_name, plot_no").then(({ data }) => setPlots(data || []));
    if (role === "admin") {
      supabase.from("profiles").select("user_id, full_name").then(({ data }) => setAgents(data || []));
    }
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast({ title: "Error", description: "Name and phone are required", variant: "destructive" });
      return;
    }

    // Round-robin if no agent selected
    let agentId = form.assigned_agent || null;
    if (!agentId && agents.length > 0) {
      const { count } = await supabase.from("leads").select("*", { count: "exact", head: true });
      const idx = (count || 0) % agents.length;
      agentId = agents[idx].user_id;
    }

    const { error } = await supabase.from("leads").insert({
      name: form.name,
      phone: form.phone,
      email: form.email || null,
      location: form.location || null,
      budget: form.budget || null,
      property_interest: form.property_interest || "Residential Plot",
      source: (form.source || "Manual") as typeof SOURCES[number],
      assigned_agent: agentId,
      notes: form.notes || null,
      interested_plot: form.interested_plot || null,
    } as any);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      const agentName = agents.find(a => a.user_id === agentId)?.full_name || "auto";
      toast({ title: "Lead Added", description: `${form.name} assigned to ${agentName}` });
      navigate("/leads");
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Add New Lead</h1>
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} /></div>
                <div><Label>Phone *</Label><Input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} /></div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} /></div>
                <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} /></div>
                <div><Label>Budget</Label><Input value={form.budget} onChange={(e) => setForm({...form, budget: e.target.value})} placeholder="₹" /></div>
                <div>
                  <Label>Interested Plot</Label>
                  <Select value={form.interested_plot} onValueChange={(v) => setForm({...form, interested_plot: v})}>
                    <SelectTrigger><SelectValue placeholder="Select plot" /></SelectTrigger>
                    <SelectContent>{plots.map((p) => <SelectItem key={p.id} value={p.id}>{p.plot_name} ({p.plot_no})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Lead Source</Label>
                  <Select value={form.source} onValueChange={(v) => setForm({...form, source: v as typeof SOURCES[number]})}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Assign Agent</Label>
                  <Select value={form.assigned_agent} onValueChange={(v) => setForm({...form, assigned_agent: v})}>
                    <SelectTrigger><SelectValue placeholder="Auto-assign" /></SelectTrigger>
                    <SelectContent>{agents.map((a) => <SelectItem key={a.user_id} value={a.user_id}>{a.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} /></div>
              <Button type="submit" className="w-full">Add Lead</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
