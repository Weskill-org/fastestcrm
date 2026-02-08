import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  console.log('meta-select-page: Request received', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
    console.log('meta-select-page: Request body:', JSON.stringify(body));
    
    const { companyId, pageId, pageName } = body;

    if (!companyId || !pageId || !pageName) {
      console.error('meta-select-page: Missing required parameters');
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
      .maybeSingle();

    console.log('meta-select-page: Integration lookup:', { integration: !!integration, error: fetchError });

    if (fetchError) {
      console.error('meta-select-page: Fetch error:', fetchError);
      return new Response(JSON.stringify({ error: 'Database error: ' + fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!integration) {
      console.error('meta-select-page: Integration not found');
      return new Response(JSON.stringify({ error: 'Integration not found. Please login with Facebook first.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userAccessToken = integration.access_token;
    if (!userAccessToken) {
      console.error('meta-select-page: No access token in integration');
      return new Response(JSON.stringify({ error: 'No access token found. Please reconnect to Facebook.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get page access token (long-lived page token)
    console.log('meta-select-page: Fetching page access token for page:', pageId);
    const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token&access_token=${userAccessToken}`;
    const pagesResponse = await fetch(pagesUrl);
    const pagesData = await pagesResponse.json();

    console.log('meta-select-page: Pages API response status:', pagesResponse.status);

    if (pagesData.error) {
      console.error('meta-select-page: Error fetching pages:', pagesData.error);
      return new Response(JSON.stringify({ error: pagesData.error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const selectedPage = pagesData.data?.find((p: any) => p.id === pageId);
    if (!selectedPage) {
      console.error('meta-select-page: Page not found in response');
      return new Response(JSON.stringify({ error: 'Page not found or no access' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Page access tokens obtained via /me/accounts are already long-lived (no expiry)
    // when the user token is a long-lived token
    const pageAccessToken = selectedPage.access_token;
    console.log('meta-select-page: Got page access token, length:', pageAccessToken?.length);

    // Subscribe to page webhooks for leadgen
    console.log('meta-select-page: Subscribing to leadgen webhook...');
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
    console.log('meta-select-page: Subscribe response:', JSON.stringify(subscribeData));

    if (subscribeData.error) {
      console.warn('meta-select-page: Webhook subscription warning:', subscribeData.error);
      // Continue anyway - might need app review
    }

    // Generate verify token for webhook
    const verifyToken = 'fastestcrm_meta_verify_2024';

    // Calculate token expiry - page tokens from long-lived user tokens don't expire,
    // but we'll set a far future date for tracking
    const tokenExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year

    // Update integration with page info AND page access token
    console.log('meta-select-page: Updating integration record...');
    const { error: updateError } = await supabase
      .from('performance_marketing_integrations')
      .update({
        page_id: pageId,
        page_name: pageName,
        access_token: pageAccessToken, // Store page access token (long-lived)
        token_expires_at: tokenExpiresAt,
        webhook_verify_token: verifyToken,
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', integration.id);

    if (updateError) {
      console.error('meta-select-page: Update error:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update integration: ' + updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('meta-select-page: Integration updated successfully');

    // Build webhook URL
    const webhookUrl = `${supabaseUrl}/functions/v1/meta-lead-webhook`;

    const response = { 
      success: true,
      pageName,
      webhookUrl,
      verifyToken,
      subscriptionSuccess: !subscribeData.error,
      message: 'Page connected successfully! Lead forms on this page will now sync to your CRM.'
    };
    
    console.log('meta-select-page: Sending success response');
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('meta-select-page: Caught error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
