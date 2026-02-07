import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Get requesting user
    const { data: { user: requester }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !requester) {
      throw new Error("Unauthorized");
    }

    const { targetUserId } = await req.json();
    if (!targetUserId) {
      throw new Error("Missing targetUserId");
    }

    // Prevent self-deletion
    if (targetUserId === requester.id) {
      throw new Error("You cannot delete yourself");
    }

    // Fetch requester info and target info in parallel
    const [requesterRoleResult, targetProfileResult] = await Promise.all([
      supabaseAdmin.from("user_roles").select("role").eq("user_id", requester.id).maybeSingle(),
      supabaseAdmin.from("profiles").select("id, company_id, manager_id").eq("id", targetUserId).maybeSingle()
    ]);

    const requesterRole = requesterRoleResult.data?.role;
    const targetProfile = targetProfileResult.data;

    if (!targetProfile) {
      throw new Error("Target user not found");
    }

    // Check if requester is company admin or in hierarchy above target
    const ROLE_LEVELS: Record<string, number> = {
      company: 1, company_subadmin: 2, level_3: 3, level_4: 4, level_5: 5,
      level_6: 6, level_7: 7, level_8: 8, level_9: 9, level_10: 10,
      level_11: 11, level_12: 12, level_13: 13, level_14: 14, level_15: 15,
      level_16: 16, level_17: 17, level_18: 18, level_19: 19, level_20: 20,
      cbo: 3, vp: 4, avp: 5, dgm: 6, agm: 7, sm: 8, tl: 9, bde: 10, intern: 11, ca: 12
    };

    // Simple permission: Only company admins can delete, or managers can delete their direct/indirect reports
    const requesterLevel = ROLE_LEVELS[requesterRole || ''] ?? 99;

    // Get target's role
    const { data: targetRoleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", targetUserId)
      .maybeSingle();

    const targetLevel = ROLE_LEVELS[targetRoleData?.role || ''] ?? 99;

    // Only allow deletion if requester has higher authority
    if (requesterLevel >= targetLevel) {
      throw new Error("You can only delete team members below your level");
    }

    // 1. Delete all forms created by this user
    const { error: formsError } = await supabaseAdmin
      .from("forms")
      .delete()
      .eq("created_by_id", targetUserId);

    if (formsError) {
      console.error("Error deleting user forms:", formsError);
      // We continue even if this fails? Or fail? 
      // Safest is to fail so we don't leave partial state or fail at the next step anyway.
      throw new Error("Failed to delete user forms: " + formsError.message);
    }

    // Delete user from auth (this will cascade to profiles due to FK)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      throw new Error("Failed to delete user: " + deleteError.message);
    }

    // Also clean up user_roles (might not cascade automatically)
    await supabaseAdmin.from("user_roles").delete().eq("user_id", targetUserId);

    console.log(`User ${targetUserId} deleted by ${requester.id}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Delete member error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
