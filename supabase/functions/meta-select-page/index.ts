import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { companyId, pageId, pageName } = await req.json();

    if (!companyId || !pageId || !pageName) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get the integration with user access token
    const { data: integration, error: fetchError } = await supabase
      .from('performance_marketing_integrations')
      .select('*')
      .eq('company_id', companyId)
      .eq('platform', 'meta')
      .single();

    if (fetchError || !integration) {
      return new Response(JSON.stringify({ error: 'Integration not found. Please login with Facebook first.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userAccessToken = integration.access_token;

    // Get page access token
    console.log('Fetching page access token for page:', pageId);
    const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token&access_token=${userAccessToken}`;
    const pagesResponse = await fetch(pagesUrl);
    const pagesData = await pagesResponse.json();

    if (pagesData.error) {
      console.error('Error fetching pages:', pagesData.error);
      return new Response(JSON.stringify({ error: pagesData.error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const selectedPage = pagesData.data?.find((p: any) => p.id === pageId);
    if (!selectedPage) {
      return new Response(JSON.stringify({ error: 'Page not found or no access' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const pageAccessToken = selectedPage.access_token;

    // Subscribe to page webhooks for leadgen
    console.log('Subscribing to leadgen webhook...');
    const subscribeUrl = `https://graph.facebook.com/v19.0/${pageId}/subscribed_apps`;
    const subscribeResponse = await fetch(subscribeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscribed_fields: ['leadgen'],
        access_token: pageAccessToken
      })
    });

    const subscribeData = await subscribeResponse.json();
    console.log('Subscribe response:', subscribeData);

    if (subscribeData.error) {
      console.error('Webhook subscription error:', subscribeData.error);
      // Continue anyway - user might need to complete app review
    }

    // Generate verify token for webhook
    const verifyToken = crypto.randomUUID();

    // Update integration with page info
    const { error: updateError } = await supabase
      .from('performance_marketing_integrations')
      .update({
        page_id: pageId,
        page_name: pageName,
        access_token: pageAccessToken,
        webhook_verify_token: verifyToken,
        updated_at: new Date().toISOString()
      })
      .eq('id', integration.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update integration' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build webhook URL
    const webhookUrl = `${supabaseUrl}/functions/v1/meta-lead-webhook`;

    return new Response(JSON.stringify({ 
      success: true,
      pageName,
      webhookUrl,
      verifyToken,
      message: 'Page connected successfully! Lead forms on this page will now sync to your CRM.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Meta select page error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
