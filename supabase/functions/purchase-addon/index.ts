import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

const COSTS = {
    'custom_slug': 100,
    'custom_domain': 5000
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('No authorization header')

        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        })

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) throw new Error('Not authenticated')

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('company_id')
            .eq('id', user.id)
            .single()

        if (!profile?.company_id) throw new Error('No company found')
        const companyId = profile.company_id

        const { feature } = await req.json()
        if (!feature || !COSTS[feature as keyof typeof COSTS]) {
            throw new Error('Invalid feature requested')
        }

        const cost = COSTS[feature as keyof typeof COSTS];

        // 1. Check if already owned
        const { data: company } = await supabaseAdmin
            .from('companies')
            .select('features')
            .eq('id', companyId)
            .single()

        const currentFeatures = company?.features || {};
        if (currentFeatures[feature]) {
            throw new Error('Feature already unlocked');
        }

        // 2. Check Wallet
        const { data: wallet } = await supabaseAdmin
            .from('wallets')
            .select('balance')
            .eq('company_id', companyId)
            .single()

        const currentBalance = wallet ? Number(wallet.balance) : 0
        if (currentBalance < cost) {
            throw new Error(`Insufficient wallet balance. Required: ₹${cost}, Available: ₹${currentBalance}. Please recharge.`);
        }

        // 3. Process Transaction
        // Deduct
        const { error: walletError } = await supabaseAdmin
            .from('wallets')
            .update({ balance: currentBalance - cost, updated_at: new Date().toISOString() })
            .eq('company_id', companyId);

        if (walletError) throw new Error('Wallet deduction failed');

        // Log
        await supabaseAdmin.from('wallet_transactions').insert({
            wallet_id: companyId,
            amount: cost,
            type: 'debit_manual_adjustment', // Or we add a new enum? Let's use manual/adjustment for now or 'debit_feature_purchase' if strictly needed. 
            // Wait, enum is strict: 'credit_recharge', 'credit_gift_card', 'debit_license_purchase', 'debit_auto_renewal', 'debit_manual_adjustment'.
            // 'debit_license_purchase' is closest, but it's not a license. 'debit_manual_adjustment' fits best for one-offs.
            description: `Unlocked Feature: ${feature.replace('custom_', 'Custom ')}`,
            status: 'success'
        });

        // Unlock Feature
        const newFeatures = { ...currentFeatures, [feature]: true };
        const { error: updateError } = await supabaseAdmin
            .from('companies')
            .update({ features: newFeatures })
            .eq('id', companyId);

        if (updateError) {
            console.error('Feature Unlock Failed', updateError);
            throw new Error('Failed to unlock feature after payment. Contact support.');
        }

        return new Response(
            JSON.stringify({ success: true, new_balance: currentBalance - cost, features: newFeatures }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
