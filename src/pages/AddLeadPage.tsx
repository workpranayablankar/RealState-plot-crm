import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useCRMStore } from "@/store/crm-store";
import { AGENTS, LEAD_SOURCES, PROPERTY_INTERESTS } from "@/data/crm-data";
import { LeadSource, PropertyInterest } from "@/types/crm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

export default function AddLeadPage() {
  const navigate = useNavigate();
  const addLead = useCRMStore((s) => s.addLead);
  const [form, setForm] = useState({
    name: "", phone: "", email: "", location: "", budget: "",
    propertyInterest: "" as PropertyInterest, source: "" as LeadSource,
    assignedAgent: "", notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast({ title: "Error", description: "Name and phone are required", variant: "destructive" });
      return;
    }
    const agent = AGENTS.find((a) => a.id === form.assignedAgent) || AGENTS[Math.floor(Math.random() * AGENTS.length)];
    addLead({
      ...form,
      assignedAgent: agent.id,
      assignedAgentName: agent.name,
      status: "New Lead",
      propertyInterest: form.propertyInterest || "Residential Plot",
      source: form.source || "Manual",
    });
    toast({ title: "Lead Added", description: `${form.name} has been added and assigned to ${agent.name}` });
    navigate("/leads");
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
                  <Label>Property Interest</Label>
                  <Select value={form.propertyInterest} onValueChange={(v) => setForm({...form, propertyInterest: v as PropertyInterest})}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{PROPERTY_INTERESTS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Lead Source</Label>
                  <Select value={form.source} onValueChange={(v) => setForm({...form, source: v as LeadSource})}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{LEAD_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Assign Agent</Label>
                  <Select value={form.assignedAgent} onValueChange={(v) => setForm({...form, assignedAgent: v})}>
                    <SelectTrigger><SelectValue placeholder="Auto-assign" /></SelectTrigger>
                    <SelectContent>{AGENTS.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
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
