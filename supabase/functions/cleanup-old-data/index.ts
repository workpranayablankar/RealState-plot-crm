import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const results: Record<string, number> = {};

    // 1. Notifications older than 30 days
    const notif30d = new Date(now);
    notif30d.setDate(notif30d.getDate() - 30);
    const { count: notifCount } = await supabase
      .from("notifications")
      .delete({ count: "exact" })
      .lt("created_at", notif30d.toISOString());
    results.notifications_deleted = notifCount ?? 0;

    // 2. Activities (temporary logs) older than 60 days
    const logs60d = new Date(now);
    logs60d.setDate(logs60d.getDate() - 60);
    const { count: activityCount } = await supabase
      .from("activities")
      .delete({ count: "exact" })
      .lt("created_at", logs60d.toISOString());
    results.activities_deleted = activityCount ?? 0;

    // 3. Call history older than 90 days (3 months)
    const calls90d = new Date(now);
    calls90d.setDate(calls90d.getDate() - 90);
    const { count: callCount } = await supabase
      .from("call_history")
      .delete({ count: "exact" })
      .lt("created_at", calls90d.toISOString());
    results.call_history_deleted = callCount ?? 0;

    // 4. Unqualified leads (Not Interested) older than 6 months
    const leads6m = new Date(now);
    leads6m.setMonth(leads6m.getMonth() - 6);
    const { count: leadCount } = await supabase
      .from("leads")
      .delete({ count: "exact" })
      .eq("status", "Not Interested")
      .lt("created_at", leads6m.toISOString());
    results.unqualified_leads_deleted = leadCount ?? 0;

    console.log("Cleanup completed:", results);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
