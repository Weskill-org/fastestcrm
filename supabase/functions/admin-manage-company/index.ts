import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
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

        // Auth with user token
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        })

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) throw new Error('Not authenticated')

        // Use service role for admin operations
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        // Verify platform admin
        const { data: adminCheck, error: adminError } = await supabaseAdmin
            .from('platform_admins')
            .select('id')
            .eq('user_id', user.id)
            .single()

        if (adminError || !adminCheck) {
            throw new Error('Access denied. Platform admin privileges required.')
        }

        const body = await req.json()
        const { action } = body

        console.log(`Admin action: ${action}`, body)

        switch (action) {
            case 'add_wallet_credits': {
                const { company_id, amount, description } = body
                if (!company_id || !amount || amount <= 0) {
                    throw new Error('Invalid company_id or amount')
                }

                // Get current wallet
                const { data: wallet, error: walletError } = await supabaseAdmin
                    .from('wallets')
                    .select('balance')
                    .eq('company_id', company_id)
                    .single()

                if (walletError) {
                    // Create wallet if doesn't exist
                    await supabaseAdmin.from('wallets').insert({
                        company_id,
                        balance: amount,
                        currency: 'INR'
                    })
                } else {
                    // Update existing wallet
                    await supabaseAdmin
                        .from('wallets')
                        .update({ 
                            balance: Number(wallet.balance) + amount,
                            updated_at: new Date().toISOString()
                        })
                        .eq('company_id', company_id)
                }

                // Log transaction
                await supabaseAdmin.from('wallet_transactions').insert({
                    wallet_id: company_id,
                    amount: amount,
                    type: 'credit_recharge',
                    description: description || `Admin credit: ₹${amount}`,
                    status: 'success'
                })

                return new Response(
                    JSON.stringify({ success: true, message: `Added ₹${amount} to wallet` }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            case 'edit_subscription': {
                const { company_id, subscription_valid_until, subscription_status, total_licenses } = body
                if (!company_id) throw new Error('company_id required')

                const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
                if (subscription_valid_until !== undefined) updates.subscription_valid_until = subscription_valid_until
                if (subscription_status !== undefined) updates.subscription_status = subscription_status
                if (total_licenses !== undefined) updates.total_licenses = total_licenses

                const { error } = await supabaseAdmin
                    .from('companies')
                    .update(updates)
                    .eq('id', company_id)

                if (error) throw error

                return new Response(
                    JSON.stringify({ success: true, message: 'Subscription updated' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            case 'toggle_active': {
                const { company_id, is_active } = body
                if (!company_id || is_active === undefined) throw new Error('company_id and is_active required')

                const { error } = await supabaseAdmin
                    .from('companies')
                    .update({ is_active, updated_at: new Date().toISOString() })
                    .eq('id', company_id)

                if (error) throw error

                return new Response(
                    JSON.stringify({ success: true, message: `Company ${is_active ? 'activated' : 'deactivated'}` }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            case 'get_company_details': {
                const { company_id } = body
                if (!company_id) throw new Error('company_id required')

                // Get company
                const { data: company, error: companyError } = await supabaseAdmin
                    .from('companies')
                    .select('*')
                    .eq('id', company_id)
                    .single()

                if (companyError) throw companyError

                // Get wallet
                const { data: wallet } = await supabaseAdmin
                    .from('wallets')
                    .select('balance, currency')
                    .eq('company_id', company_id)
                    .single()

                // Get products
                const { data: products } = await supabaseAdmin
                    .from('products')
                    .select('*')
                    .eq('company_id', company_id)

                // Get leads count from the company's table
                const tableName = company.custom_leads_table || 'leads'
                let leadsCount = 0
                
                // Get lead count - try custom table first
                if (company.custom_leads_table) {
                    const { count } = await supabaseAdmin
                        .from(company.custom_leads_table)
                        .select('*', { count: 'exact', head: true })
                        .eq('company_id', company_id)
                    leadsCount = count || 0
                } else {
                    const { count } = await supabaseAdmin
                        .from('leads')
                        .select('*', { count: 'exact', head: true })
                        .eq('company_id', company_id)
                    leadsCount = count || 0
                }

                // Get team members
                const { data: profiles } = await supabaseAdmin
                    .from('profiles')
                    .select('id, full_name, email')
                    .eq('company_id', company_id)

                return new Response(
                    JSON.stringify({
                        company,
                        wallet: wallet || { balance: 0, currency: 'INR' },
                        products: products || [],
                        leads_count: leadsCount,
                        team_members: profiles || []
                    }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            case 'get_all_stats': {
                // Get all companies
                const { data: companies, error: companiesError } = await supabaseAdmin
                    .from('companies')
                    .select('id, name, slug, is_active, total_licenses, used_licenses, subscription_status, subscription_valid_until, created_at')

                if (companiesError) throw companiesError

                // Get all wallets
                const { data: wallets } = await supabaseAdmin
                    .from('wallets')
                    .select('company_id, balance')

                const walletMap = new Map()
                wallets?.forEach(w => walletMap.set(w.company_id, Number(w.balance)))

                // Calculate stats
                const totalCompanies = companies?.length || 0
                const activeCompanies = companies?.filter(c => c.is_active).length || 0
                const totalLicenses = companies?.reduce((acc, c) => acc + (c.total_licenses || 0), 0) || 0
                const usedLicenses = companies?.reduce((acc, c) => acc + (c.used_licenses || 0), 0) || 0
                const totalWalletBalance = wallets?.reduce((acc, w) => acc + Number(w.balance), 0) || 0

                // Expiring soon (within 7 days)
                const now = new Date()
                const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
                const expiringSoon = companies?.filter(c => {
                    if (!c.subscription_valid_until) return false
                    const expiry = new Date(c.subscription_valid_until)
                    return expiry > now && expiry <= week
                }).length || 0

                return new Response(
                    JSON.stringify({
                        stats: {
                            totalCompanies,
                            activeCompanies,
                            inactiveCompanies: totalCompanies - activeCompanies,
                            totalLicenses,
                            usedLicenses,
                            availableLicenses: totalLicenses - usedLicenses,
                            totalWalletBalance,
                            expiringSoon
                        },
                        companies: companies?.map(c => ({
                            ...c,
                            wallet_balance: walletMap.get(c.id) || 0
                        }))
                    }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            case 'create_discount_code': {
                const { code, discount_percentage, total_uses, valid_until } = body
                if (!code || !discount_percentage) throw new Error('code and discount_percentage required')

                const { error } = await supabaseAdmin.from('discount_codes').insert({
                    code: code.toUpperCase(),
                    discount_percentage,
                    total_uses: total_uses || 1,
                    uses_count: 0,
                    valid_until: valid_until || null,
                    active: true
                })

                if (error) throw error

                return new Response(
                    JSON.stringify({ success: true, message: 'Discount code created' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            case 'delete_discount_code': {
                const { code } = body
                if (!code) throw new Error('code required')

                const { error } = await supabaseAdmin
                    .from('discount_codes')
                    .delete()
                    .eq('code', code)

                if (error) throw error

                return new Response(
                    JSON.stringify({ success: true, message: 'Discount code deleted' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            case 'toggle_discount_code': {
                const { code, active } = body
                if (!code || active === undefined) throw new Error('code and active required')

                const { error } = await supabaseAdmin
                    .from('discount_codes')
                    .update({ active })
                    .eq('code', code)

                if (error) throw error

                return new Response(
                    JSON.stringify({ success: true, message: `Code ${active ? 'activated' : 'deactivated'}` }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            case 'get_discount_codes': {
                const { data, error } = await supabaseAdmin
                    .from('discount_codes')
                    .select('*')
                    .order('created_at', { ascending: false })

                if (error) throw error

                return new Response(
                    JSON.stringify({ codes: data || [] }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            case 'create_gift_card': {
                const { code, amount, expires_at } = body
                if (!code || !amount) throw new Error('code and amount required')

                const { error } = await supabaseAdmin.from('gift_cards').insert({
                    code: code.toUpperCase(),
                    amount,
                    expires_at: expires_at || null,
                    active: true,
                    is_redeemed: false
                })

                if (error) throw error

                return new Response(
                    JSON.stringify({ success: true, message: 'Gift card created' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            case 'create_bulk_gift_cards': {
                const { amount, count, expires_at } = body
                if (!amount || !count) throw new Error('amount and count required')

                const cards = []
                for (let i = 0; i < count; i++) {
                    const code = `GC${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`
                    cards.push({
                        code,
                        amount,
                        expires_at: expires_at || null,
                        active: true,
                        is_redeemed: false
                    })
                }

                const { error } = await supabaseAdmin.from('gift_cards').insert(cards)

                if (error) throw error

                return new Response(
                    JSON.stringify({ success: true, message: `Created ${count} gift cards`, codes: cards.map(c => c.code) }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            case 'delete_gift_card': {
                const { code } = body
                if (!code) throw new Error('code required')

                const { error } = await supabaseAdmin
                    .from('gift_cards')
                    .delete()
                    .eq('code', code)

                if (error) throw error

                return new Response(
                    JSON.stringify({ success: true, message: 'Gift card deleted' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            case 'get_gift_cards': {
                const { data, error } = await supabaseAdmin
                    .from('gift_cards')
                    .select('*')
                    .order('created_at', { ascending: false })

                if (error) throw error

                return new Response(
                    JSON.stringify({ cards: data || [] }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            case 'add_product': {
                const { company_id, name, category, price, quantity_available } = body
                if (!company_id || !name || !category) throw new Error('company_id, name, and category required')

                const { error } = await supabaseAdmin.from('products').insert({
                    company_id,
                    name,
                    category,
                    price: price || 0,
                    quantity_available: quantity_available || null
                })

                if (error) throw error

                return new Response(
                    JSON.stringify({ success: true, message: 'Product added' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            case 'update_product': {
                const { product_id, name, category, price, quantity_available } = body
                if (!product_id) throw new Error('product_id required')

                const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
                if (name !== undefined) updates.name = name
                if (category !== undefined) updates.category = category
                if (price !== undefined) updates.price = price
                if (quantity_available !== undefined) updates.quantity_available = quantity_available

                const { error } = await supabaseAdmin
                    .from('products')
                    .update(updates)
                    .eq('id', product_id)

                if (error) throw error

                return new Response(
                    JSON.stringify({ success: true, message: 'Product updated' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            case 'delete_product': {
                const { product_id } = body
                if (!product_id) throw new Error('product_id required')

                const { error } = await supabaseAdmin
                    .from('products')
                    .delete()
                    .eq('id', product_id)

                if (error) throw error

                return new Response(
                    JSON.stringify({ success: true, message: 'Product deleted' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            default:
                throw new Error(`Unknown action: ${action}`)
        }

    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
