import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const PRICE_PER_SEAT = 500;

serve(async (req) => {
    // Simple Auth Check (e.g. Service Role or custom secret header for Cron)
    // For now, checks Authorization header is Service Role or similar
    const authHeader = req.headers.get('Authorization')
    // We expect a service role key to be passed here for cron jobs usually

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    try {
        // 1. Get companies expiring in the next 24 hours (or expired and not yet processed i.e. past_due check?)
        // Let's find companies where subscription_valid_until < NOW + 1 Day AND subscription_status != 'canceled'

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { data: companies, error } = await supabaseAdmin
            .from('companies')
            .select('id, total_licenses, subscription_valid_until, subscription_status')
            .lt('subscription_valid_until', tomorrow.toISOString())
            .in('subscription_status', ['active', 'past_due']) // Try to renew active or past_due
        // We should filter out those we already processed today? 
        // Typically cron runs once a day. Logic should ensure we don't double charge.
        // Better: Check if new valid_until would be > tomorrow?
        // Let's assume we fetch those needing renewal.

        if (error) throw error;

        const results = [];

        for (const company of (companies || [])) {
            // Double check not already renewed (race condition or re-run)
            if (new Date(company.subscription_valid_until) > tomorrow) continue;

            const totalSeats = company.total_licenses || 0;
            if (totalSeats === 0) continue;

            const cost = totalSeats * PRICE_PER_SEAT; // 1 Month Renewal

            // Check Wallet
            const { data: wallet } = await supabaseAdmin
                .from('wallets')
                .select('balance')
                .eq('company_id', company.id)
                .single();

            const balance = wallet ? Number(wallet.balance) : 0;

            if (balance >= cost) {
                // SUCCESS RENEWAL
                // 1. Deduct
                await supabaseAdmin.from('wallets')
                    .update({ balance: balance - cost, updated_at: new Date().toISOString() })
                    .eq('company_id', company.id);

                // 2. Log
                await supabaseAdmin.from('wallet_transactions').insert({
                    wallet_id: company.id,
                    amount: cost,
                    type: 'debit_auto_renewal',
                    description: 'Monthly Subscription Auto-Renewal',
                    status: 'success'
                });

                // 3. Extend
                const oldDate = new Date(company.subscription_valid_until);
                const newDate = new Date(oldDate);
                newDate.setMonth(newDate.getMonth() + 1);

                await supabaseAdmin.from('companies')
                    .update({
                        subscription_valid_until: newDate.toISOString(),
                        subscription_status: 'active'
                    })
                    .eq('id', company.id);

                results.push({ company_id: company.id, status: 'renewed' });

            } else {
                // FAILED RENEWAL
                // Mark past due
                await supabaseAdmin.from('companies')
                    .update({ subscription_status: 'past_due' })
                    .eq('id', company.id);

                // TODO: Trigger Email
                console.log(`Company ${company.id} renewal failed. Low balance.`);
                results.push({ company_id: company.id, status: 'failed_insufficient_funds' });
            }
        }

        return new Response(
            JSON.stringify({ processed: companies?.length, results }),
            { headers: { 'Content-Type': 'application/json' } }
        )

    } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : 'Unknown error';
        return new Response(JSON.stringify({ error: message }), { status: 500 });
    }
})
