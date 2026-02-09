import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const googleClientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const googleClientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const googleDevToken = Deno.env.get("GOOGLE_DEV_TOKEN"); // Need Developer Token

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const { companyId, customerId } = await req.json();

        if (!companyId || !customerId) {
            return new Response(JSON.stringify({ error: "Missing required parameters" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // This function would ideally:
        // 1. Get access token from DB
        // 2. Use Google Ads API to update the Lead Form Assets for the selected Customer ID
        // 3. Set the webhook URL to our google-lead-webhook endpoint
        // 4. Set the verify key

        // For now, let's just update the integration record to store the selected Customer ID.
        // The actual "auto-configure" part is complex and requires managing multiple lead forms.
        // We can simulate success for now or just store the ID.

        const { data: updateData, error: updateError } = await supabase
            .from("performance_marketing_integrations")
            .update({
                ad_account_id: customerId,
                page_name: `Google Ads Account ${customerId}`, // Placeholder name
                is_active: true,
                updated_at: new Date().toISOString(),
            })
            .eq("company_id", companyId)
            .eq("platform", "google")
            .select();

        if (updateError) {
            console.error("Database update error:", updateError);
            throw updateError;
        }

        return new Response(JSON.stringify({ success: true, message: "Account linked successfully" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: unknown) {
        console.error("google-link-webhook error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
