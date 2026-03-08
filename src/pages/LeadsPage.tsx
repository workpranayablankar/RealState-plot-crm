import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, Eye, Download, Trash2, Phone, CheckCircle, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Lead = Tables<"leads">;
type LeadStatus = Lead["status"];

const STATUSES: LeadStatus[] = ["New Lead", "Contacted", "Interested", "Site Visit Scheduled", "Negotiation", "Deal Closed", "Not Interested"];
const SOURCES = ["Website", "Facebook Ads", "Google Ads", "Manual"];

const statusClass: Record<string, string> = {
  "New Lead": "status-new", "Contacted": "status-contacted", "Interested": "status-interested",
  "Site Visit Scheduled": "status-visit", "Negotiation": "status-negotiation",
  "Deal Closed": "status-closed", "Not Interested": "status-notinterested",
};

export default function LeadsPage() {
  const { role, user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<{ user_id: string; full_name: string }[]>([]);
  const [plots, setPlots] = useState<{ id: string; plot_name: string; plot_no: string }[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchLeads = async () => {
    let query = supabase.from("leads").select("*").order("created_at", { ascending: false });
    if (role === "agent" || role === "telecaller") query = query.eq("assigned_agent", user?.id);
    const { data } = await query;
    setLeads(data || []);
  };

  useEffect(() => {
    if (user) {
      fetchLeads();
      supabase.from("plots").select("id, plot_name, plot_no").then(({ data }) => setPlots(data || []));
      if (role === "admin") {
        supabase.from("profiles").select("user_id, full_name").then(({ data }) => setAgents(data || []));
      }
    }
  }, [user, role]);

  const filtered = leads.filter((l) => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search);
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    const matchSource = sourceFilter === "all" || l.source === sourceFilter;
    return matchSearch && matchStatus && matchSource;
  });

  const selectedLead = selectedId ? leads.find((l) => l.id === selectedId) : null;

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    await supabase.from("leads").update(updates).eq("id", id);
    fetchLeads();
  };

  const markLeadStatus = async (id: string, status: LeadStatus) => {
    await supabase.from("leads").update({
      status,
      contacted_by: user?.id,
      contacted_at: new Date().toISOString(),
    } as any).eq("id", id);
    toast({ title: `Lead marked as ${status}` });
    fetchLeads();
  };

  const deleteLead = async (id: string) => {
    await supabase.from("leads").delete().eq("id", id);
    setSelectedId(null);
    toast({ title: "Lead deleted" });
    fetchLeads();
  };

  const getAgentName = (agentId: string | null) => {
    if (!agentId) return "Unassigned";
    return agents.find((a) => a.user_id === agentId)?.full_name || "Unknown";
  };

  const getPlotName = (plotId: string | null) => {
    if (!plotId) return "—";
    const p = plots.find((pl) => pl.id === plotId);
    return p ? `${p.plot_name} (${p.plot_no})` : "—";
  };

  const exportCSV = () => {
    const headers = ["Name", "Phone", "Email", "Location", "Budget", "Property Interest", "Interested Plot", "Source", "Agent", "Status", "Notes", "Created"];
    const rows = filtered.map((l) => [
      l.name, l.phone, l.email || "", l.location || "", l.budget || "",
      l.property_interest || "", getPlotName((l as any).interested_plot),
      l.source, getAgentName(l.assigned_agent), l.status, (l.notes || "").replace(/\n/g, " "), l.created_at,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${filtered.length} leads exported to CSV` });
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Leads</h1>
            <p className="text-sm text-muted-foreground">{filtered.length} leads found</p>
          </div>
          <div className="flex items-center gap-2">
            {role === "admin" && (
              <Button variant="outline" onClick={exportCSV}>
                <Download className="mr-2 h-4 w-4" />Export CSV
              </Button>
            )}
            {role === "telecaller" && selectedLead && (
              <Button variant="outline" asChild>
                <a href={`tel:${selectedLead.phone}`}><Phone className="mr-2 h-4 w-4" />Call Now</a>
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Source" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Phone</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Interested Plot</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Source</th>
                    {role === "admin" && <th className="px-4 py-3 text-left font-medium text-muted-foreground">Agent</th>}
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Budget</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead) => (
                    <tr key={lead.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{lead.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{lead.phone}</td>
                      <td className="px-4 py-3 text-muted-foreground">{getPlotName((lead as any).interested_plot)}</td>
                      <td className="px-4 py-3"><Badge variant="secondary" className="font-normal">{lead.source}</Badge></td>
                      {role === "admin" && <td className="px-4 py-3 text-muted-foreground">{getAgentName(lead.assigned_agent)}</td>}
                      <td className="px-4 py-3"><span className={`status-badge ${statusClass[lead.status]}`}>{lead.status}</span></td>
                      <td className="px-4 py-3 font-medium text-foreground">{lead.budget}</td>
                      <td className="px-4 py-3 flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedId(lead.id)}><Eye className="h-4 w-4" /></Button>
                        {role === "telecaller" && (
                          <>
                            <Button variant="ghost" size="sm" asChild>
                              <a href={`tel:${lead.phone}`}><Phone className="h-4 w-4 text-success" /></a>
                            </Button>
                            {lead.status === "New Lead" && (
                              <Button variant="ghost" size="sm" title="Mark Contacted" onClick={() => markLeadStatus(lead.id, "Contacted")}>
                                <CheckCircle className="h-4 w-4 text-primary" />
                              </Button>
                            )}
                          </>
                        )}
                        {role === "admin" && (
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteLead(lead.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <div className="py-12 text-center text-muted-foreground">No leads found.</div>}
            </div>
          </CardContent>
        </Card>

        <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedId(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Lead Details</DialogTitle></DialogHeader>
            {selectedLead && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><Label className="text-muted-foreground">Name</Label><p className="font-medium">{selectedLead.name}</p></div>
                  <div><Label className="text-muted-foreground">Phone</Label><p className="font-medium">{selectedLead.phone}</p></div>
                  <div><Label className="text-muted-foreground">Email</Label><p className="font-medium">{selectedLead.email}</p></div>
                  <div><Label className="text-muted-foreground">Location</Label><p className="font-medium">{selectedLead.location}</p></div>
                  <div><Label className="text-muted-foreground">Budget</Label><p className="font-medium">{selectedLead.budget}</p></div>
                  <div><Label className="text-muted-foreground">Property Interest</Label><p className="font-medium">{selectedLead.property_interest}</p></div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Interested Plot</Label>
                  <Select
                    value={(selectedLead as any).interested_plot || "none"}
                    onValueChange={(val) => updateLead(selectedLead.id, { interested_plot: val === "none" ? null : val } as any)}
                  >
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select plot" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— None —</SelectItem>
                      {plots.map((p) => <SelectItem key={p.id} value={p.id}>{p.plot_name} ({p.plot_no})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Select value={selectedLead.status} onValueChange={(val) => updateLead(selectedLead.id, { status: val as LeadStatus })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {role === "admin" && (
                  <div>
                    <Label className="text-muted-foreground">Assign Agent</Label>
                    <Select value={selectedLead.assigned_agent || ""} onValueChange={(val) => updateLead(selectedLead.id, { assigned_agent: val })}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select agent" /></SelectTrigger>
                      <SelectContent>{agents.map((a) => <SelectItem key={a.user_id} value={a.user_id}>{a.full_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <Textarea
                    value={selectedLead.notes || ""}
                    onChange={(e) => updateLead(selectedLead.id, { notes: e.target.value })}
                    placeholder="Add call notes..."
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
