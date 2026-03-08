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
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json();

    const { name, phone, email, source, location, budget, property_interest, notes } = body;

    if (!name || !phone) {
      return new Response(JSON.stringify({ error: "name and phone are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate source against allowed values
    const validSources = ["Website", "Facebook Ads", "Google Ads", "WhatsApp", "Manual"];
    const leadSource = validSources.includes(source) ? source : "Website";

    // Determine agent assignment (check for round robin)
    let assigned_agent: string | null = null;

    const { data: settings } = await supabaseAdmin
      .from("assignment_settings")
      .select("*")
      .limit(1)
      .single();

    if (settings?.method === "round_robin") {
      // Get all agents
      const { data: agentRoles } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", "agent");

      if (agentRoles && agentRoles.length > 0) {
        const idx = (settings.last_assigned_index || 0) % agentRoles.length;
        assigned_agent = agentRoles[idx].user_id;

        // Update index
        await supabaseAdmin
          .from("assignment_settings")
          .update({ last_assigned_index: idx + 1 })
          .eq("id", settings.id);
      }
    }

    const { data: lead, error } = await supabaseAdmin.from("leads").insert({
      name,
      phone,
      email: email || "",
      source: leadSource,
      location: location || "",
      budget: budget || "",
      property_interest: property_interest || "Residential Plot",
      notes: notes || "",
      assigned_agent,
    }).select().single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create notification for assigned agent or all admins
    if (assigned_agent) {
      await supabaseAdmin.from("notifications").insert({
        user_id: assigned_agent,
        title: "New Lead Assigned",
        message: `${name} (${phone}) has been assigned to you via ${leadSource}.`,
        type: "lead_assigned",
        lead_id: lead.id,
      });
    }

    // Log activity
    const activityUser = assigned_agent || "00000000-0000-0000-0000-000000000000";
    await supabaseAdmin.from("activities").insert({
      user_id: activityUser,
      activity_type: "Lead Created",
      description: `New lead "${name}" captured from ${leadSource}`,
      lead_id: lead.id,
    });

    return new Response(JSON.stringify({ success: true, lead_id: lead.id }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
