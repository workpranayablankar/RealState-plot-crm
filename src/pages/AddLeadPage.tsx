import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "@/hooks/use-toast";
import { Check, ChevronsUpDown, UserPlus, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImportLeadsModal } from "@/components/ImportLeadsModal";

const SOURCES = ["Website", "Facebook", "Instagram", "Referral", "Direct Call", "Other"] as const;

export default function AddLeadPage() {
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const [agents, setAgents] = useState<{ user_id: string; full_name: string }[]>([]);
  const [plots, setPlots] = useState<{ id: string; plot_name: string; plot_no: string }[]>([]);
  const [plotOpen, setPlotOpen] = useState(false);
  const [plotSearch, setPlotSearch] = useState("");
  const [agentOpen, setAgentOpen] = useState(false);
  const [agentSearch, setAgentSearch] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const [form, setForm] = useState({
    name: "", phone: "", email: "", location: "", address: "", budget: "",
    property_interest: "", source: "" as typeof SOURCES[number] | "",
    assigned_agent: "", assigned_agent_label: "", notes: "", interested_plot: "", interested_plot_label: "",
  });

  useEffect(() => {
    supabase.from("plots").select("id, plot_name, plot_no").then(({ data }) => setPlots(data || []));
    if (role === "admin") {
      supabase.from("profiles").select("user_id, full_name").then(({ data }) => setAgents(data || []));
    }
  }, [role]);

  const filteredPlots = useMemo(() => {
    if (!plotSearch) return plots;
    const q = plotSearch.toLowerCase();
    return plots.filter(p =>
      p.plot_name.toLowerCase().includes(q) || p.plot_no.toLowerCase().includes(q)
    );
  }, [plots, plotSearch]);

  const filteredAgents = useMemo(() => {
    if (!agentSearch) return agents;
    const q = agentSearch.toLowerCase();
    return agents.filter(a => a.full_name.toLowerCase().includes(q));
  }, [agents, agentSearch]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.phone.trim()) errs.phone = "Phone is required";
    else if (!/^\d+$/.test(form.phone.trim())) errs.phone = "Phone must be numeric";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleBudgetChange = (value: string) => {
    const numeric = value.replace(/[^0-9]/g, "");
    setForm({ ...form, budget: numeric });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    let agentId = form.assigned_agent || null;
    if (role === "agent") {
      agentId = user?.id || null;
    } else if (!agentId && agents.length > 0) {
      const { count } = await supabase.from("leads").select("*", { count: "exact", head: true });
      const idx = (count || 0) % agents.length;
      agentId = agents[idx].user_id;
    }

    const { error } = await supabase.from("leads").insert({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      location: form.location.trim() || null,
      address: form.address.trim() || null,
      budget: form.budget ? `₹${form.budget}` : null,
      property_interest: form.property_interest || "Residential Plot",
      source: (form.source || "Manual") as any,
      assigned_agent: agentId,
      notes: form.notes.trim() || null,
      interested_plot: form.interested_plot || null,
    } as any);

    setSubmitting(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      const agentName = agents.find(a => a.user_id === agentId)?.full_name || "auto";
      toast({ title: "Lead Added", description: `${form.name} assigned to ${agentName}` });
      navigate("/leads");
    }
  };

  const setField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: "" }));
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Add New Lead</h1>
              <p className="text-sm text-muted-foreground">Fill in the details to create a new lead</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4 mr-2" /> Import Leads (CSV)
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Lead Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Name <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    placeholder="Full name"
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Phone <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    placeholder="Phone number"
                    className={errors.phone ? "border-destructive" : ""}
                  />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>
              </div>

              {/* Email & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="Email address" />
                </div>
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <Input value={form.location} onChange={(e) => setField("location", e.target.value)} placeholder="City / Area" />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <Label>Address</Label>
                <Textarea
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                  placeholder="Full address"
                  rows={3}
                />
              </div>

              {/* Budget & Interested Plot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Budget</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                    <Input
                      value={form.budget}
                      onChange={(e) => handleBudgetChange(e.target.value)}
                      placeholder="Amount"
                      className="pl-7"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Interested Plot</Label>
                  <Popover open={plotOpen} onOpenChange={setPlotOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={plotOpen}
                        className="w-full justify-between font-normal"
                      >
                        {form.interested_plot_label || "Search or type plot..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search plot..."
                          value={plotSearch}
                          onValueChange={setPlotSearch}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {plotSearch && (
                              <button
                                type="button"
                                className="w-full px-4 py-2 text-sm text-left hover:bg-accent cursor-pointer"
                                onClick={() => {
                                  setForm(prev => ({
                                    ...prev,
                                    interested_plot: "",
                                    interested_plot_label: plotSearch,
                                    property_interest: plotSearch,
                                  }));
                                  setPlotOpen(false);
                                  setPlotSearch("");
                                }}
                              >
                                Use custom: "<span className="font-medium">{plotSearch}</span>"
                              </button>
                            )}
                          </CommandEmpty>
                          <CommandGroup>
                            {filteredPlots.map((p) => (
                              <CommandItem
                                key={p.id}
                                value={`${p.plot_name} ${p.plot_no}`}
                                onSelect={() => {
                                  setForm(prev => ({
                                    ...prev,
                                    interested_plot: p.id,
                                    interested_plot_label: `${p.plot_name} (${p.plot_no})`,
                                    property_interest: p.plot_name,
                                  }));
                                  setPlotOpen(false);
                                  setPlotSearch("");
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", form.interested_plot === p.id ? "opacity-100" : "opacity-0")} />
                                {p.plot_name} ({p.plot_no})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Lead Source & Assign Agent */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Lead Source</Label>
                  <Select value={form.source} onValueChange={(v) => setField("source", v)}>
                    <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                    <SelectContent>
                      {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {role === "admin" && (
                  <div className="space-y-1.5">
                    <Label>Assign Agent</Label>
                    <Select value={form.assigned_agent} onValueChange={(v) => setField("assigned_agent", v)}>
                      <SelectTrigger><SelectValue placeholder="Auto-assign" /></SelectTrigger>
                      <SelectContent>
                        {agents.map((a) => <SelectItem key={a.user_id} value={a.user_id}>{a.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="Additional notes..." rows={3} />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Adding..." : "Add Lead"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <ImportLeadsModal open={importOpen} onOpenChange={setImportOpen} onImported={() => navigate("/leads")} />
    </AppLayout>
  );
}
