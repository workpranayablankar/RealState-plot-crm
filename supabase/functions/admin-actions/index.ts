import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Verify caller is admin
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }

  const { data: roleData } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (roleData?.role !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden: admin only" }), { status: 403, headers: corsHeaders });
  }

  const body = await req.json();
  const { action, target_user_id, new_password } = body;

  if (action === "delete_user") {
    if (!target_user_id) {
      return new Response(JSON.stringify({ error: "target_user_id required" }), { status: 400, headers: corsHeaders });
    }
    // Prevent self-delete
    if (target_user_id === user.id) {
      return new Response(JSON.stringify({ error: "Cannot delete yourself" }), { status: 400, headers: corsHeaders });
    }
    // Clean up all related data before deleting the auth user
    await supabaseAdmin.from("notifications").delete().eq("user_id", target_user_id);
    await supabaseAdmin.from("activities").delete().eq("user_id", target_user_id);
    await supabaseAdmin.from("call_history").delete().eq("user_id", target_user_id);
    await supabaseAdmin.from("follow_ups").delete().eq("assigned_agent", target_user_id);
    await supabaseAdmin.from("leads").update({ assigned_agent: null }).eq("assigned_agent", target_user_id);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", target_user_id);
    await supabaseAdmin.from("profiles").delete().eq("user_id", target_user_id);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(target_user_id);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (action === "change_password") {
    if (!target_user_id || !new_password) {
      return new Response(JSON.stringify({ error: "target_user_id and new_password required" }), { status: 400, headers: corsHeaders });
    }
    if (new_password.length < 6) {
      return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), { status: 400, headers: corsHeaders });
    }
    const { error } = await supabaseAdmin.auth.admin.updateUserById(target_user_id, { password: new_password });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
