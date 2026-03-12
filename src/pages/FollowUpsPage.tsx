import { useEffect, useState, useCallback } from "react";
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
import { CalendarClock, Plus, Check, Phone, Clock, AlertTriangle, Trash2, Bell } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, isToday, isTomorrow, isBefore, startOfDay } from "date-fns";

interface FollowUp {
  id: string;
  lead_id: string;
  assigned_agent: string;
  follow_up_date: string;
  follow_up_time: string | null;
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
  const [form, setForm] = useState({ lead_id: "", follow_up_date: "", follow_up_time: "", notes: "" });
  const [remindedIds, setRemindedIds] = useState<Set<string>>(new Set());

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

  // Check for follow-up reminders every minute
  const checkReminders = useCallback(() => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    followUps.forEach((fu) => {
      if (fu.status !== "Pending" || !fu.follow_up_time || remindedIds.has(fu.id)) return;
      if (!isToday(new Date(fu.follow_up_date))) return;

      // Check if current time matches or has passed the follow-up time (within 1 min window)
      const fuTimeParts = fu.follow_up_time.split(":");
      const fuTimeStr = `${fuTimeParts[0]}:${fuTimeParts[1]}`;
      if (currentTime >= fuTimeStr && currentTime <= `${fuTimeParts[0]}:${String(Number(fuTimeParts[1]) + 1).padStart(2, '0')}`) {
        toast({
          title: `⏰ Follow-up Reminder`,
          description: `Time to call ${fu.lead_name} (${fu.lead_phone})`,
        });

        // Create in-app notification
        if (user?.id) {
          supabase.from("notifications").insert({
            user_id: fu.assigned_agent,
            title: "Follow-up Reminder",
            message: `Scheduled call with ${fu.lead_name} (${fu.lead_phone}) at ${fuTimeStr}`,
            type: "reminder",
            lead_id: fu.lead_id,
          }).then(() => {});
        }

        setRemindedIds((prev) => new Set([...prev, fu.id]));
      }
    });
  }, [followUps, remindedIds, user?.id]);

  useEffect(() => {
    const interval = setInterval(checkReminders, 30000); // Check every 30 seconds
    checkReminders(); // Check immediately
    return () => clearInterval(interval);
  }, [checkReminders]);

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

  const deleteFollowUp = async (id: string) => {
    await supabase.from("follow_ups").delete().eq("id", id);
    toast({ title: "Follow-up deleted" });
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
      follow_up_time: form.follow_up_time || null,
      notes: form.notes,
    } as any);
    toast({ title: "Follow-up scheduled" });
    setShowAdd(false);
    setForm({ lead_id: "", follow_up_date: "", follow_up_time: "", notes: "" });
    fetchData();
  };

  const formatTime = (time: string | null) => {
    if (!time) return null;
    const parts = time.split(":");
    const h = parseInt(parts[0]);
    const m = parts[1];
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  const FollowUpCard = ({ fu }: { fu: FollowUp }) => (
    <div className="flex items-center justify-between rounded-lg border bg-card p-4">
      <div className="space-y-1">
        <p className="font-medium text-foreground">{fu.lead_name}</p>
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <Phone className="h-3 w-3" /> {fu.lead_phone}
        </p>
        {fu.notes && <p className="text-sm text-muted-foreground">{fu.notes}</p>}
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          Agent: {fu.agent_name} · {format(new Date(fu.follow_up_date), "dd MMM yyyy")}
          {fu.follow_up_time && (
            <span className="inline-flex items-center gap-0.5 ml-1 text-primary font-medium">
              <Bell className="h-3 w-3" /> {formatTime(fu.follow_up_time)}
            </span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {fu.status === "Pending" && (
          <Button size="sm" variant="outline" onClick={() => markComplete(fu.id)}>
            <Check className="h-4 w-4 mr-1" /> Done
          </Button>
        )}
        {fu.status === "Completed" && <Badge className="bg-success text-success-foreground">Completed</Badge>}
        {role === "admin" && (
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteFollowUp(fu.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Follow Up Date</Label>
                <Input type="date" value={form.follow_up_date} onChange={e => setForm({ ...form, follow_up_date: e.target.value })} />
              </div>
              <div>
                <Label>Follow Up Time</Label>
                <Input type="time" value={form.follow_up_time} onChange={e => setForm({ ...form, follow_up_time: e.target.value })} placeholder="e.g. 4:00 PM" />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Customer said call at 4 PM..." />
            </div>
            <Button className="w-full" onClick={handleAdd}>Schedule</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
