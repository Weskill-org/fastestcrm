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
  const metaAppId = Deno.env.get('META_APP_ID');
  const metaAppSecret = Deno.env.get('META_APP_SECRET');

  if (!metaAppId || !metaAppSecret) {
    return new Response(JSON.stringify({ error: 'Meta App credentials not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { code, redirectUri, companyId, defaultStatus } = await req.json();

    if (!code || !redirectUri || !companyId) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Exchanging code for access token...');

    // Exchange code for access token
    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${metaAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${metaAppSecret}&code=${code}`;
    
    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Token exchange error:', tokenData.error);
      return new Response(JSON.stringify({ error: tokenData.error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const shortLivedToken = tokenData.access_token;

    // Exchange for long-lived token
    const longLivedUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${metaAppId}&client_secret=${metaAppSecret}&fb_exchange_token=${shortLivedToken}`;
    
    const longLivedResponse = await fetch(longLivedUrl);
    const longLivedData = await longLivedResponse.json();

    const accessToken = longLivedData.access_token || shortLivedToken;
    const expiresIn = longLivedData.expires_in || 3600;

    console.log('Got access token, fetching user pages...');

    // Get user's pages with required permissions
    const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token&access_token=${accessToken}`;
    const pagesResponse = await fetch(pagesUrl);
    const pagesData = await pagesResponse.json();

    if (pagesData.error) {
      console.error('Pages fetch error:', pagesData.error);
      return new Response(JSON.stringify({ error: pagesData.error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const pages = pagesData.data || [];
    console.log(`Found ${pages.length} pages`);

    // Store the user token temporarily - we'll update with page token when user selects a page
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Check if integration already exists
    const { data: existing } = await supabase
      .from('performance_marketing_integrations')
      .select('id')
      .eq('company_id', companyId)
      .eq('platform', 'meta')
      .single();

    if (existing) {
      // Update existing
      await supabase
        .from('performance_marketing_integrations')
        .update({
          access_token: accessToken,
          token_expires_at: tokenExpiresAt,
          default_lead_status: defaultStatus || 'new',
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      // Create new integration
      await supabase
        .from('performance_marketing_integrations')
        .insert({
          company_id: companyId,
          platform: 'meta',
          access_token: accessToken,
          token_expires_at: tokenExpiresAt,
          default_lead_status: defaultStatus || 'new',
          is_active: true
        });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      pages: pages.map((p: any) => ({ id: p.id, name: p.name }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Meta OAuth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
