import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

const PRICE_PER_SEAT = 500 // Base price INR

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

        const { action, quantity, months } = await req.json()
        // actions: 'add_seats', 'extend_subscription'

        // Get Company & Wallet
        const { data: company } = await supabaseAdmin
            .from('companies')
            .select('total_licenses, subscription_valid_until, subscription_status')
            .eq('id', companyId)
            .single()

        const { data: wallet } = await supabaseAdmin
            .from('wallets')
            .select('balance')
            .eq('company_id', companyId)
            .single()

        const currentBalance = wallet ? Number(wallet.balance) : 0
        let cost = 0;
        let description = '';
        let updates = {};

        if (action === 'add_seats') {
            const qty = Number(quantity);
            if (qty < 1) throw new Error('Invalid quantity');

            // Logic: Calculate cost for remaining duration of current subscription
            // If no subscription or expired, assume 1 month start or specific logic?
            // Let's assume if expired/null, we add 1 month from now for THESE seats? 
            // Or simpler: We align with existing expiry. If expired, we must extend first (UI should handle).
            // Let's assume valid_until is valid or we charge for 30 days.

            const now = new Date();
            const validUntil = company.subscription_valid_until ? new Date(company.subscription_valid_until) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

            let daysRemaining = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 3600 * 24));
            if (daysRemaining < 0) daysRemaining = 0; // Expired

            // If expired, maybe we just charge for 30 days and reset subscription date?
            // But that desyncs if they have other seats.
            // Let's assume 'Extend Subscription' handles revival. 
            // 'Add Seats' only adds to ACTIVE or newly Active period.

            if (daysRemaining === 0) {
                // If expired, adding seats essentially restarts sub? 
                // Let's enforce 30 days minimum for new seats if expired
                daysRemaining = 30;
                updates = {
                    subscription_valid_until: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    subscription_status: 'active'
                }
            }

            // Pro-rated cost
            // Cost = (Price / 30) * Days * Qty
            const dailyRate = PRICE_PER_SEAT / 30;
            cost = Math.ceil(dailyRate * daysRemaining * qty);

            description = `Purchased ${qty} seat(s) for ${daysRemaining} days`;
            updates = {
                ...updates,
                total_licenses: (company.total_licenses || 0) + qty,
                // If subscription was null, set valid_until
                ...(company.subscription_valid_until ? {} : {
                    subscription_valid_until: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    subscription_status: 'active'
                })
            };

        } else if (action === 'extend_subscription') {
            const durationMonths = Number(months); // 1, 3, 6, 12
            if (![1, 3, 6, 12].includes(durationMonths)) throw new Error('Invalid duration');

            const totalSeats = company.total_licenses || 1; // At least charge for 1 seat if 0? Or user block?
            // If 0 seats, maybe charge base fee? Let's assume 0 seats = 0 cost? No, usually a platform fee.
            // Let's assume we charge for total_licenses.

            let discount = 0;
            if (durationMonths === 3) discount = 0.10;
            else if (durationMonths === 6) discount = 0.20;
            else if (durationMonths === 12) discount = 0.40;

            const baseCost = totalSeats * PRICE_PER_SEAT * durationMonths;
            cost = Math.ceil(baseCost * (1 - discount));

            description = `Extended subscription by ${durationMonths} months (${discount * 100}% off)`;

            const currentValidUntil = company.subscription_valid_until && new Date(company.subscription_valid_until) > new Date()
                ? new Date(company.subscription_valid_until)
                : new Date();

            // Add months
            const newValidUntil = new Date(currentValidUntil);
            newValidUntil.setMonth(newValidUntil.getMonth() + durationMonths);

            updates = {
                subscription_valid_until: newValidUntil.toISOString(),
                subscription_status: 'active'
            };
        } else {
            throw new Error('Invalid action');
        }

        // Check Balance
        if (currentBalance < cost) {
            throw new Error(`Insufficient wallet balance. Required: ₹${cost}, Available: ₹${currentBalance}. Please recharge.`);
        }

        // Process Transaction
        // 1. Deduct Wallet
        const { error: walletError } = await supabaseAdmin
            .from('wallets')
            .update({ balance: currentBalance - cost, updated_at: new Date().toISOString() })
            .eq('company_id', companyId);

        if (walletError) throw new Error('Wallet deduction failed');

        // 2. Log Transaction
        await supabaseAdmin.from('wallet_transactions').insert({
            wallet_id: companyId,
            amount: cost,
            type: 'debit_license_purchase', // or auto_renewal if generic
            description: description,
            status: 'success'
        });

        // 3. Update Company Subscription
        const { error: companyError } = await supabaseAdmin
            .from('companies')
            .update(updates)
            .eq('id', companyId);

        if (companyError) {
            // Critical: Money deducted but product not given.
            // TODO: Rollback wallet?
            console.error('Company Update Failed', companyError);
            throw new Error('Failed to update subscription. Please contact support.');
        }

        return new Response(
            JSON.stringify({ success: true, cost, updates }),
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
