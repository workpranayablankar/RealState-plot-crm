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

  const users = [
    { email: "admin@realty.com", password: "admin123456", full_name: "Admin Owner", role: "admin" },
    { email: "rahul@realty.com", password: "agent123456", full_name: "Rahul Sharma", role: "agent" },
    { email: "priya@realty.com", password: "agent123456", full_name: "Priya Patel", role: "agent" },
    { email: "akash@realty.com", password: "agent123456", full_name: "Akash Singh", role: "agent" },
    { email: "neha@realty.com", password: "agent123456", full_name: "Neha Gupta", role: "agent" },
    { email: "vikram@realty.com", password: "agent123456", full_name: "Vikram Reddy", role: "agent" },
  ];

  const results = [];

  for (const u of users) {
    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((eu: any) => eu.email === u.email);
    
    if (existing) {
      results.push({ email: u.email, status: "already exists" });
      continue;
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.full_name },
    });

    if (authError) {
      results.push({ email: u.email, error: authError.message });
      continue;
    }

    // Assign role
    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: authData.user.id,
      role: u.role,
    });

    results.push({ email: u.email, status: "created", roleError: roleError?.message });
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
