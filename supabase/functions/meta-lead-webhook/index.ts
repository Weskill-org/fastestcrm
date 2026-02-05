import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    // Handle webhook verification (GET request from Meta)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      console.log('Meta webhook verification request:', { mode, token });

      if (mode === 'subscribe') {
        // Look up the integration with this verify token
        const { data: integration } = await supabase
          .from('performance_marketing_integrations')
          .select('id')
          .eq('platform', 'meta')
          .eq('webhook_verify_token', token)
          .eq('is_active', true)
          .single();

        if (integration) {
          console.log('Webhook verified successfully');
          return new Response(challenge, { 
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
      }

      return new Response('Verification failed', { status: 403 });
    }

    // Handle lead notification (POST request)
    if (req.method === 'POST') {
      const body = await req.json();
      console.log('Meta lead webhook received:', JSON.stringify(body, null, 2));

      // Meta sends webhooks in this format:
      // { object: "page", entry: [{ id: "page_id", time: timestamp, changes: [...] }] }
      if (body.object !== 'page' || !body.entry) {
        return new Response(JSON.stringify({ error: 'Invalid payload' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      for (const entry of body.entry) {
        const pageId = entry.id;
        
        // Find the integration for this page
        const { data: integration } = await supabase
          .from('performance_marketing_integrations')
          .select('*, companies!inner(custom_leads_table, admin_id)')
          .eq('platform', 'meta')
          .eq('is_active', true)
          .or(`page_id.eq.${pageId},page_id.is.null`)
          .limit(1)
          .single();

        if (!integration) {
          console.log('No integration found for page:', pageId);
          continue;
        }

        // Process each leadgen change
        for (const change of entry.changes || []) {
          if (change.field !== 'leadgen') continue;

          const leadgenId = change.value?.leadgen_id;
          const formId = change.value?.form_id;
          const adId = change.value?.ad_id;
          const adgroupId = change.value?.adgroup_id;
          const createdTime = change.value?.created_time;

          console.log('Processing Meta lead:', { leadgenId, formId });

          // Create lead in the appropriate table
          const tableName = integration.companies?.custom_leads_table || 'leads';
          const adminId = integration.companies?.admin_id;

          // Build lead data
          // Note: For full lead details, you'd need to call Meta's Graph API
          // with the access token. This creates a basic lead record.
          const leadData = {
            name: `Meta Lead ${leadgenId?.substring(0, 8) || 'Unknown'}`,
            company_id: integration.company_id,
            created_by_id: adminId,
            sales_owner_id: adminId,
            status: integration.default_lead_status || 'new',
            lead_source: `Meta - Form ${formId || 'Unknown'}`,
            utm_source: 'meta',
            utm_medium: 'paid',
            utm_campaign: adgroupId || adId || null,
          };

          const { error: insertError } = await supabase
            .from(tableName)
            .insert(leadData);

          if (insertError) {
            console.error('Error inserting Meta lead:', insertError);
          } else {
            console.log('Meta lead created successfully');
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Method not allowed', { status: 405 });

  } catch (error: unknown) {
    console.error('Meta webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
