import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Bell, Mail, MessageCircle } from "lucide-react";

interface NotifPref {
  id: string;
  event_type: string;
  in_app: boolean;
  email: boolean;
  sms: boolean;
}

const EVENT_LABELS: Record<string, string> = {
  new_lead_assigned: "New Lead Assigned",
  follow_up_reminder: "Follow-Up Reminder",
  site_visit_scheduled: "Site Visit Scheduled",
  deal_closed: "Deal Closed",
};

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState<NotifPref[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrefs = async () => {
    setLoading(true);
    const { data } = await supabase.from("notification_preferences").select("*");
    setPrefs((data as NotifPref[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchPrefs(); }, []);

  const toggle = async (pref: NotifPref, field: "in_app" | "email" | "sms") => {
    const { error } = await supabase
      .from("notification_preferences")
      .update({ [field]: !pref[field] })
      .eq("id", pref.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setPrefs((prev) => prev.map((p) => p.id === pref.id ? { ...p, [field]: !p[field] } : p));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Notification Settings</h2>
        <p className="text-sm text-muted-foreground">Control which alerts are sent and through which channels</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-foreground">Event</th>
                  <th className="px-4 py-3 text-center font-medium text-foreground">
                    <span className="flex items-center justify-center gap-1"><Bell className="h-3.5 w-3.5" /> In-App</span>
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-foreground">
                    <span className="flex items-center justify-center gap-1"><Mail className="h-3.5 w-3.5" /> Email</span>
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-foreground">
                    <span className="flex items-center justify-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> SMS/WhatsApp</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {prefs.map((pref) => (
                  <tr key={pref.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {EVENT_LABELS[pref.event_type] || pref.event_type}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Switch checked={pref.in_app} onCheckedChange={() => toggle(pref, "in_app")} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Switch checked={pref.email} onCheckedChange={() => toggle(pref, "email")} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Switch checked={pref.sms} onCheckedChange={() => toggle(pref, "sms")} />
                        <Badge variant="outline" className="text-xs">Optional</Badge>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <div className="rounded bg-muted/50 border p-3">
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong> In-app notifications are always available. Email delivery requires email integration setup. SMS/WhatsApp requires a third-party API connection.
        </p>
      </div>
    </div>
  );
}
