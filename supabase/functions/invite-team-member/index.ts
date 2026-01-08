import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  fullName: string;
  password: string;
  role: string;
}

const VALID_ROLES = [
  "company", "company_subadmin", "cbo", "vp", "avp",
  "dgm", "agm", "sm", "tl", "bde", "intern", "ca"
];

const ROLE_LEVELS: Record<string, number> = {
  company: 1, company_subadmin: 2, cbo: 3, vp: 4, avp: 5,
  dgm: 6, agm: 7, sm: 8, tl: 9, bde: 10, intern: 11, ca: 12
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get and validate authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client for verifying the requester
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Admin client for creating users
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Get the requesting user
    const { data: { user: requester }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !requester) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ensure requester has a profile row (required because profiles.manager_id FK references profiles.id)
    const { data: requesterProfile, error: requesterProfileError } = await supabaseAdmin
      .from("profiles")
      .select("id, company_id, full_name, email, manager_id")
      .eq("id", requester.id)
      .maybeSingle();

    if (requesterProfileError) {
      console.error("Requester profile fetch error:", requesterProfileError);
      return new Response(
        JSON.stringify({ error: "Could not verify your profile" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let requesterCompanyId: string | null = requesterProfile?.company_id ?? null;

    // Fallback for Company Admins where profile might not exist yet
    if (!requesterCompanyId) {
      const { data: companyRow, error: companyError } = await supabaseAdmin
        .from("companies")
        .select("id")
        .eq("admin_id", requester.id)
        .maybeSingle();

      if (companyError) {
        console.error("Company lookup error:", companyError);
      }

      requesterCompanyId = companyRow?.id ?? null;
    }

    if (!requesterCompanyId) {
      return new Response(
        JSON.stringify({ error: "Your account is not linked to a company." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the requester's profile row if missing (prevents FK failure when inviting someone)
    if (!requesterProfile) {
      const requesterFullName = (requester.user_metadata as Record<string, unknown> | null)?.["full_name"];

      const { error: ensureRequesterProfileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: requester.id,
          email: requester.email,
          full_name: typeof requesterFullName === "string" ? requesterFullName : null,
          manager_id: null,
          company_id: requesterCompanyId,
        });

      if (ensureRequesterProfileError) {
        console.error("Ensure requester profile error:", ensureRequesterProfileError);
        return new Response(
          JSON.stringify({ error: "Could not create your profile record" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Parse and validate request body
    const body: InviteRequest = await req.json();
    const { email, fullName, password, role } = body;

    // Input validation
    if (!email || !fullName || !password || !role) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate full name length
    if (fullName.length > 100) {
      return new Response(
        JSON.stringify({ error: "Full name must be less than 100 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate password
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate role is in allowed list
    if (!VALID_ROLES.includes(role)) {
      return new Response(
        JSON.stringify({ error: "Invalid role" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get requester's role
    const { data: requesterRoleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requester.id)
      .single();

    if (roleError || !requesterRoleData) {
      console.error("Role fetch error:", roleError);
      return new Response(
        JSON.stringify({ error: "Could not verify your role" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requesterLevel = ROLE_LEVELS[requesterRoleData.role] || 99;
    const targetLevel = ROLE_LEVELS[role] || 99;

    // Server-side validation: requester can only assign roles below their level
    if (requesterLevel >= targetLevel) {
      console.log(`Permission denied: requester level ${requesterLevel} cannot assign level ${targetLevel}`);
      return new Response(
        JSON.stringify({ error: "You cannot assign this role. You can only assign roles below your level." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the user with admin client
    const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        manager_id: requester.id
      }
    });

    if (signUpError) {
      console.error("Signup error:", signUpError);
      return new Response(
        JSON.stringify({ error: signUpError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newUserId = signUpData.user?.id;
    if (!newUserId) {
      return new Response(
        JSON.stringify({ error: "Failed to create user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ensure the new user is added to profiles with correct manager_id + company_id
    const { error: upsertProfileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: newUserId,
          email,
          full_name: fullName,
          manager_id: requester.id,
          company_id: requesterCompanyId,
        },
        { onConflict: "id" }
      );

    if (upsertProfileError) {
      console.error("Profile upsert error:", upsertProfileError);
      // Rollback user creation to avoid orphaned auth users
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return new Response(
        JSON.stringify({ error: "Failed to create profile for new user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Set role (keep a single role row per user)
    const { error: deleteRolesError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", newUserId);

    if (deleteRolesError) {
      console.error("Role cleanup error:", deleteRolesError);
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return new Response(
        JSON.stringify({ error: "Failed to set role for new user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: insertRoleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUserId, role });

    if (insertRoleError) {
      console.error("Role insert error:", insertRoleError);
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return new Response(
        JSON.stringify({ error: "Failed to set role for new user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully invited ${email} as ${role} by ${requester.email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: newUserId,
        message: `${fullName} has been added successfully.`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
