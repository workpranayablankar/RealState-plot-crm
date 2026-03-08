import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Meta webhook verification (GET)
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const VERIFY_TOKEN = Deno.env.get("FACEBOOK_VERIFY_TOKEN") || "crm_facebook_verify";

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return new Response(challenge, { status: 200, headers: corsHeaders });
    }
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

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

    // Meta Lead Ads webhook format
    let name = "";
    let phone = "";
    let email = "";

    // Meta Leadgen webhook: body.entry[].changes[].value.leadgen_id
    // For simplicity, also accept direct format
    if (body.entry) {
      // Meta sends leadgen_id, you'd normally fetch lead data via Graph API
      // For direct integration, accept field_data format
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const fieldData = changes?.value?.field_data || [];

      for (const field of fieldData) {
        if (field.name === "full_name" || field.name === "name") name = field.values?.[0] || "";
        if (field.name === "phone_number" || field.name === "phone") phone = field.values?.[0] || "";
        if (field.name === "email") email = field.values?.[0] || "";
      }
    }
    // Direct/simplified format (via Zapier, Make, etc.)
    else {
      name = body.name || body.full_name || "";
      phone = body.phone || body.phone_number || "";
      email = body.email || "";
    }

    if (!phone && !name) {
      return new Response(JSON.stringify({ error: "No lead data found" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!name) name = `Facebook Lead (${phone})`;
    if (!phone) phone = "N/A";

    // Round robin assignment
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
      name,
      phone,
      email: email || "",
      source: "Facebook Ads" as any,
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
        title: "New Facebook Lead",
        message: `${name} (${phone}) from Facebook Ads.`,
        type: "lead_assigned",
        lead_id: lead.id,
      });
    }

    await supabaseAdmin.from("activities").insert({
      user_id: assigned_agent || "00000000-0000-0000-0000-000000000000",
      activity_type: "Lead Created",
      description: `Facebook Ads lead "${name}" captured automatically`,
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
