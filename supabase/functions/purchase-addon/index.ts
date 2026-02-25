import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts";



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
