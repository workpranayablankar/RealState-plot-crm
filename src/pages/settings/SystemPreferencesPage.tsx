import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Settings } from "lucide-react";

interface Preferences {
  id: string;
  company_name: string;
  currency: string;
  timezone: string;
  date_format: string;
  default_lead_status: string;
  default_assignment: string;
}

const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Australia/Sydney",
];

const DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];
const CURRENCIES = ["₹", "$", "€", "£", "AED", "SGD", "AUD"];

export default function SystemPreferencesPage() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase.from("system_preferences").select("*").limit(1).single();
      if (data) setPrefs(data as Preferences);
      setLoading(false);
    };
    fetch();
  }, []);

  const handleSave = async () => {
    if (!prefs) return;
    setSaving(true);
    const { id, ...updates } = prefs;
    const { error } = await supabase.from("system_preferences").update(updates).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Preferences saved" });
    }
    setSaving(false);
  };

  if (loading) return <p className="text-muted-foreground">Loading...</p>;
  if (!prefs) return <p className="text-muted-foreground">No preferences found.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-foreground">System Preferences</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">Configure your CRM settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" /> General Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div>
              <Label>Company Name</Label>
              <Input
                value={prefs.company_name}
                onChange={(e) => setPrefs({ ...prefs, company_name: e.target.value })}
              />
            </div>

            <div>
              <Label>Currency</Label>
              <Select value={prefs.currency} onValueChange={(v) => setPrefs({ ...prefs, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Time Zone</Label>
              <Select value={prefs.timezone} onValueChange={(v) => setPrefs({ ...prefs, timezone: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Date Format</Label>
              <Select value={prefs.date_format} onValueChange={(v) => setPrefs({ ...prefs, date_format: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DATE_FORMATS.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Default Lead Status</Label>
              <Select value={prefs.default_lead_status} onValueChange={(v) => setPrefs({ ...prefs, default_lead_status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="New Lead">New Lead</SelectItem>
                  <SelectItem value="Contacted">Contacted</SelectItem>
                  <SelectItem value="Interested">Interested</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Default Lead Assignment</Label>
              <Select value={prefs.default_assignment} onValueChange={(v) => setPrefs({ ...prefs, default_assignment: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="round_robin">Round Robin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="mt-2">
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
