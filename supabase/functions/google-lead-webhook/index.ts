import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, google-lead-token',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const url = new URL(req.url);
    const companyId = url.searchParams.get('company');

    if (!companyId) {
      return new Response(JSON.stringify({ error: 'Missing company parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Find the integration for this company
    const { data: integration } = await supabase
      .from('performance_marketing_integrations')
      .select('*, companies!inner(custom_leads_table, admin_id)')
      .eq('platform', 'google')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .single();

    if (!integration) {
      return new Response(JSON.stringify({ error: 'Integration not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate webhook key (from header or body)
    const webhookKey = req.headers.get('google-lead-token');
    
    if (req.method === 'POST') {
      const body = await req.json();
      console.log('Google Ads lead webhook received:', JSON.stringify(body, null, 2));

      // Google Ads Lead Form webhook payload format:
      // {
      //   lead_id: string,
      //   api_version: string,
      //   form_id: number,
      //   campaign_id: number,
      //   google_key: string,
      //   is_test: boolean,
      //   gcl_id: string,
      //   adgroup_id: number,
      //   creative_id: number,
      //   user_column_data: [{ column_id: string, string_value: string, column_name: string }]
      // }

      // Validate the google_key matches our webhook key
      if (integration.webhook_verify_token && body.google_key !== integration.webhook_verify_token) {
        console.log('Webhook key mismatch');
        return new Response(JSON.stringify({ error: 'Invalid webhook key' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Parse user data from the lead
      const userData: Record<string, string> = {};
      for (const column of body.user_column_data || []) {
        const columnName = column.column_name?.toLowerCase() || column.column_id?.toLowerCase();
        if (columnName && column.string_value) {
          userData[columnName] = column.string_value;
        }
      }

      console.log('Parsed user data:', userData);

      // Map Google lead fields to our lead schema
      const tableName = integration.companies?.custom_leads_table || 'leads';
      const adminId = integration.companies?.admin_id;

      const leadData = {
        name: userData.full_name || userData.name || `Google Lead ${body.lead_id?.substring(0, 8) || 'Unknown'}`,
        email: userData.email || userData.user_email || null,
        phone: userData.phone_number || userData.phone || null,
        company_id: integration.company_id,
        created_by_id: adminId,
        sales_owner_id: adminId,
        status: integration.default_lead_status || 'new',
        lead_source: `Google Ads - Campaign ${body.campaign_id || 'Unknown'}`,
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: body.campaign_id?.toString() || null,
      };

      const { error: insertError } = await supabase
        .from(tableName)
        .insert(leadData);

      if (insertError) {
        console.error('Error inserting Google lead:', insertError);
        // Don't fail - Google expects 200 response
      } else {
        console.log('Google lead created successfully');
      }

      // Google Ads expects a 200 response
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Method not allowed', { status: 405 });

  } catch (error: unknown) {
    console.error('Google webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Still return 200 to prevent Google from retrying
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
