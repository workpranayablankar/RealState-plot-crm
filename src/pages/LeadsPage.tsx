import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useCRMStore } from "@/store/crm-store";
import { LEAD_STATUSES, LEAD_SOURCES, AGENTS } from "@/data/crm-data";
import { LeadStatus, LeadSource } from "@/types/crm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, Filter, Eye } from "lucide-react";

const statusClass: Record<LeadStatus, string> = {
  "New Lead": "status-new",
  "Contacted": "status-contacted",
  "Interested": "status-interested",
  "Site Visit Scheduled": "status-visit",
  "Negotiation": "status-negotiation",
  "Deal Closed": "status-closed",
  "Not Interested": "status-notinterested",
};

export default function LeadsPage() {
  const { leads, updateLead } = useCRMStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<string | null>(null);

  const filtered = leads.filter((l) => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search);
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    const matchSource = sourceFilter === "all" || l.source === sourceFilter;
    const matchAgent = agentFilter === "all" || l.assignedAgent === agentFilter;
    return matchSearch && matchStatus && matchSource && matchAgent;
  });

  const lead = selectedLead ? leads.find((l) => l.id === selectedLead) : null;

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Leads</h1>
            <p className="text-sm text-muted-foreground">{filtered.length} leads found</p>
          </div>
        </div>

        {/* Filters */}
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
                {LEAD_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Source" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {LEAD_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Agent" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {AGENTS.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Phone</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Property</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Source</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Agent</th>
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
                      <td className="px-4 py-3 text-muted-foreground">{lead.propertyInterest}</td>
                      <td className="px-4 py-3"><Badge variant="secondary" className="font-normal">{lead.source}</Badge></td>
                      <td className="px-4 py-3 text-muted-foreground">{lead.assignedAgentName}</td>
                      <td className="px-4 py-3"><span className={`status-badge ${statusClass[lead.status]}`}>{lead.status}</span></td>
                      <td className="px-4 py-3 font-medium text-foreground">{lead.budget}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedLead(lead.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">No leads found.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lead Detail Dialog */}
        <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Lead Details</DialogTitle></DialogHeader>
            {lead && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><Label className="text-muted-foreground">Name</Label><p className="font-medium">{lead.name}</p></div>
                  <div><Label className="text-muted-foreground">Phone</Label><p className="font-medium">{lead.phone}</p></div>
                  <div><Label className="text-muted-foreground">Email</Label><p className="font-medium">{lead.email}</p></div>
                  <div><Label className="text-muted-foreground">Location</Label><p className="font-medium">{lead.location}</p></div>
                  <div><Label className="text-muted-foreground">Budget</Label><p className="font-medium">{lead.budget}</p></div>
                  <div><Label className="text-muted-foreground">Property</Label><p className="font-medium">{lead.propertyInterest}</p></div>
                  <div><Label className="text-muted-foreground">Source</Label><p className="font-medium">{lead.source}</p></div>
                  <div><Label className="text-muted-foreground">Agent</Label><p className="font-medium">{lead.assignedAgentName}</p></div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Select value={lead.status} onValueChange={(val) => updateLead(lead.id, { status: val as LeadStatus })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEAD_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground">Assign Agent</Label>
                  <Select value={lead.assignedAgent} onValueChange={(val) => {
                    const agent = AGENTS.find(a => a.id === val);
                    if (agent) updateLead(lead.id, { assignedAgent: val, assignedAgentName: agent.name });
                  }}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {AGENTS.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <Textarea
                    value={lead.notes}
                    onChange={(e) => updateLead(lead.id, { notes: e.target.value })}
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
