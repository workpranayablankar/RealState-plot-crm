import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarClock, Plus, Check, Phone, Clock, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, isToday, isTomorrow, isBefore, startOfDay } from "date-fns";

interface FollowUp {
  id: string;
  lead_id: string;
  assigned_agent: string;
  follow_up_date: string;
  notes: string;
  status: string;
  created_at: string;
  lead_name?: string;
  lead_phone?: string;
  agent_name?: string;
}

export default function FollowUpsPage() {
  const { role, user } = useAuth();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ lead_id: "", follow_up_date: "", notes: "" });

  const fetchData = async () => {
    const [fuRes, leadsRes, profilesRes] = await Promise.all([
      supabase.from("follow_ups").select("*").order("follow_up_date", { ascending: true }),
      supabase.from("leads").select("id, name, phone, assigned_agent"),
      supabase.from("profiles").select("user_id, full_name"),
    ]);

    const profileMap: Record<string, string> = {};
    (profilesRes.data || []).forEach((p: any) => { profileMap[p.user_id] = p.full_name; });

    const leadMap: Record<string, any> = {};
    (leadsRes.data || []).forEach((l: any) => { leadMap[l.id] = l; });

    const enriched = (fuRes.data || []).map((fu: any) => ({
      ...fu,
      lead_name: leadMap[fu.lead_id]?.name || "Unknown",
      lead_phone: leadMap[fu.lead_id]?.phone || "",
      agent_name: profileMap[fu.assigned_agent] || "Unassigned",
    }));

    setFollowUps(enriched);
    setLeads(leadsRes.data || []);
    setAgents(profilesRes.data || []);
  };

  useEffect(() => { fetchData(); }, []);

  const today = startOfDay(new Date());
  const pending = followUps.filter(f => f.status === "Pending");
  const overdue = pending.filter(f => isBefore(new Date(f.follow_up_date), today));
  const todayFu = pending.filter(f => isToday(new Date(f.follow_up_date)));
  const tomorrowFu = pending.filter(f => isTomorrow(new Date(f.follow_up_date)));
  const upcoming = pending.filter(f => {
    const d = new Date(f.follow_up_date);
    return !isBefore(d, today) && !isToday(d) && !isTomorrow(d);
  });

  const markComplete = async (id: string) => {
    await supabase.from("follow_ups").update({ status: "Completed" }).eq("id", id);
    toast({ title: "Follow-up marked complete" });
    fetchData();
  };

  const handleAdd = async () => {
    if (!form.lead_id || !form.follow_up_date) {
      toast({ title: "Please select a lead and date", variant: "destructive" });
      return;
    }
    const lead = leads.find(l => l.id === form.lead_id);
    const agentId = lead?.assigned_agent || user?.id;
    await supabase.from("follow_ups").insert({
      lead_id: form.lead_id,
      assigned_agent: agentId,
      follow_up_date: form.follow_up_date,
      notes: form.notes,
    });
    toast({ title: "Follow-up scheduled" });
    setShowAdd(false);
    setForm({ lead_id: "", follow_up_date: "", notes: "" });
    fetchData();
  };

  const FollowUpCard = ({ fu }: { fu: FollowUp }) => (
    <div className="flex items-center justify-between rounded-lg border bg-card p-4">
      <div className="space-y-1">
        <p className="font-medium text-foreground">{fu.lead_name}</p>
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <Phone className="h-3 w-3" /> {fu.lead_phone}
        </p>
        {fu.notes && <p className="text-sm text-muted-foreground">{fu.notes}</p>}
        <p className="text-xs text-muted-foreground">
          Agent: {fu.agent_name} · {format(new Date(fu.follow_up_date), "dd MMM yyyy")}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {fu.status === "Pending" && (
          <Button size="sm" variant="outline" onClick={() => markComplete(fu.id)}>
            <Check className="h-4 w-4 mr-1" /> Done
          </Button>
        )}
        {fu.status === "Completed" && <Badge className="bg-success text-success-foreground">Completed</Badge>}
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Follow Ups</h1>
          <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> Schedule Follow Up</Button>
        </div>

        {overdue.length > 0 && (
          <Card className="border-destructive/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" /> Overdue ({overdue.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {overdue.map(fu => <FollowUpCard key={fu.id} fu={fu} />)}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" /> Today ({todayFu.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayFu.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No follow-ups for today</p>}
            {todayFu.map(fu => <FollowUpCard key={fu.id} fu={fu} />)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" /> Tomorrow ({tomorrowFu.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tomorrowFu.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No follow-ups for tomorrow</p>}
            {tomorrowFu.map(fu => <FollowUpCard key={fu.id} fu={fu} />)}
          </CardContent>
        </Card>

        {upcoming.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Upcoming ({upcoming.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcoming.map(fu => <FollowUpCard key={fu.id} fu={fu} />)}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Schedule Follow Up</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Lead</Label>
              <Select value={form.lead_id} onValueChange={v => setForm({ ...form, lead_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select lead" /></SelectTrigger>
                <SelectContent>
                  {leads.map(l => <SelectItem key={l.id} value={l.id}>{l.name} – {l.phone}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Follow Up Date</Label>
              <Input type="date" value={form.follow_up_date} onChange={e => setForm({ ...form, follow_up_date: e.target.value })} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Call about plot pricing..." />
            </div>
            <Button className="w-full" onClick={handleAdd}>Schedule</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
