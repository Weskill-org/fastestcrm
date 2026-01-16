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

const ROLE_LEVELS: Record<string, number> = {
  company: 1, company_subadmin: 2, cbo: 3, vp: 4, avp: 5,
  dgm: 6, agm: 7, sm: 8, tl: 9, bde: 10, intern: 11, ca: 12,
  level_3: 3, level_4: 4, level_5: 5, level_6: 6, level_7: 7, level_8: 8,
  level_9: 9, level_10: 10, level_11: 11, level_12: 12, level_13: 13,
  level_14: 14, level_15: 15, level_16: 16, level_17: 17, level_18: 18,
  level_19: 19, level_20: 20
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
      throw new Error("Missing authorization header");
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
      throw new Error("Unauthorized: " + (userError?.message || "User not found"));
    }

    // PARALLEL: Fetch Profile, Role, and Owned Company simultaneously
    const [profileResult, roleResult, ownedCompanyResult] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, company_id, full_name, email, manager_id")
        .eq("id", requester.id)
        .maybeSingle(),
      supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", requester.id)
        .maybeSingle(),
      supabaseAdmin
        .from("companies")
        .select("id")
        .eq("admin_id", requester.id)
        .maybeSingle()
    ]);

    const { data: requesterProfile, error: requesterProfileError } = profileResult;
    let { data: requesterRoleData, error: roleError } = roleResult;
    const { data: ownedCompany, error: ownedCompanyError } = ownedCompanyResult;

    if (ownedCompanyError) {
      console.error("Owned company fetch error:", ownedCompanyError);
    }

    if (requesterProfileError) {
      console.error("Requester profile fetch error:", requesterProfileError);
      throw new Error("Could not verify your profile: " + requesterProfileError.message);
    }

    if (roleError) {
      console.error("Role fetch error:", roleError);
      throw new Error("Could not verify your role");
    }

    // Determine Company ID: Prefer Profile, fallback to Owned Company
    let requesterCompanyId: string | null = requesterProfile?.company_id ?? ownedCompany?.id ?? null;

    if (!requesterCompanyId) {
      throw new Error("Your account is not linked to a company.");
    }

    // Determine Role: Prefer explicit role, fallback to 'company' if they are the Admin of the target company
    if (!requesterRoleData) {
      // Check if they are the admin of the company they are trying to act within
      if (ownedCompany && ownedCompany.id === requesterCompanyId) {
        console.log("User is validated as company admin (fallback). Defaulting to 'company' role.");
        requesterRoleData = { role: 'company' };
      } else {
        throw new Error("You do not have a role assigned.");
      }
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
        throw new Error("Could not create your profile record: " + ensureRequesterProfileError.message);
      }
    }

    // Parse and validate request body
    const body: InviteRequest = await req.json();
    console.log("Invite request received:", JSON.stringify(body));
    const { email, fullName, password, role } = body;

    // Input validation
    if (!email || !fullName || !password || !role) {
      throw new Error("Missing required fields");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }

    // Validate full name length
    if (fullName.length > 100) {
      throw new Error("Full name must be less than 100 characters");
    }

    // Validate password
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    // Validate role is in allowed list - O(1) lookup
    // Using hasOwnProperty to ensure we don't pick up prototype properties, though not strict here
    // Also ensuring it maps to a valid level number
    if (ROLE_LEVELS[role] === undefined) {
      throw new Error("Invalid role");
    }

    const requesterLevel = ROLE_LEVELS[requesterRoleData.role] || 99;
    const targetLevel = ROLE_LEVELS[role] || 99;

    // Server-side validation: requester can only assign roles below their level
    if (requesterLevel >= targetLevel) {
      console.log(`Permission denied: requester level ${requesterLevel} cannot assign level ${targetLevel}`);
      throw new Error("You cannot assign this role. You can only assign roles below your level.");
    }

    console.log(`Creating user ${email} with role ${role} requested by ${requester.email}`);

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
      throw new Error(signUpError.message);
    }

    const newUserId = signUpData.user?.id;
    if (!newUserId) {
      throw new Error("Failed to create user (no ID returned)");
    }

    // Ensure the new user is added to profiles with correct manager_id + company_id
    // PARALLEL: Create Profile and Assign Role simultaneously
    // Both depend on 'newUserId' but are independent of each other.
    const [upsertProfileResult, insertRoleResult] = await Promise.all([
      supabaseAdmin
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
        ),
      supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: newUserId, role }, { onConflict: "user_id" })
    ]);

    const { error: upsertProfileError } = upsertProfileResult;
    const { error: upsertRoleError } = insertRoleResult;

    // Handle errors (Rollback if needed)
    if (upsertProfileError || upsertRoleError) {
      console.error("Error during parallel creation:", { upsertProfileError, upsertRoleError });

      // If ANY failed, we should probably delete the user to keep things clean.
      // Ideally we would revert the successful one too, but deleting the user usually cascades if setup correctly,
      // or effectively "disables" them since they won't be able to login without a profile/role often.
      await supabaseAdmin.auth.admin.deleteUser(newUserId);

      const errorMessage = upsertProfileError?.message || upsertRoleError?.message || "Failed to setup user details";
      throw new Error(errorMessage);
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
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
