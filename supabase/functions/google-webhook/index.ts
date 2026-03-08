import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json();

    // Google Ads lead form / Zapier format
    const name = body.name || body.full_name || body["Full Name"] || "";
    const phone = body.phone || body.phone_number || body["Phone Number"] || "";
    const email = body.email || body["Email"] || "";
    const location = body.location || body.city || "";

    if (!phone && !name) {
      return new Response(JSON.stringify({ error: "No lead data found" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const leadName = name || `Google Ads Lead (${phone})`;
    const leadPhone = phone || "N/A";

    // Round robin
    let assigned_agent: string | null = null;
    const { data: settings } = await supabaseAdmin
      .from("assignment_settings").select("*").limit(1).single();

    if (settings?.method === "round_robin") {
      const { data: agentRoles } = await supabaseAdmin
        .from("user_roles").select("user_id").eq("role", "agent");
      if (agentRoles && agentRoles.length > 0) {
        const idx = (settings.last_assigned_index || 0) % agentRoles.length;
        assigned_agent = agentRoles[idx].user_id;
        await supabaseAdmin.from("assignment_settings")
          .update({ last_assigned_index: idx + 1 }).eq("id", settings.id);
      }
    }

    const { data: lead, error } = await supabaseAdmin.from("leads").insert({
      name: leadName,
      phone: leadPhone,
      email: email || "",
      location: location || "",
      source: "Google Ads" as any,
      assigned_agent,
    }).select().single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (assigned_agent) {
      await supabaseAdmin.from("notifications").insert({
        user_id: assigned_agent,
        title: "New Google Ads Lead",
        message: `${leadName} (${leadPhone}) from Google Ads.`,
        type: "lead_assigned",
        lead_id: lead.id,
      });
    }

    await supabaseAdmin.from("activities").insert({
      user_id: assigned_agent || "00000000-0000-0000-0000-000000000000",
      activity_type: "Lead Created",
      description: `Google Ads lead "${leadName}" captured automatically`,
      lead_id: lead.id,
    });

    return new Response(JSON.stringify({ success: true, lead_id: lead.id }), {
      status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
