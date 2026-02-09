import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from './cors.ts'

console.log('Hello from process-reminders!')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const now = new Date().toISOString()

    // 1. Process Standard Leads
    const { data: standardLeads, error: leadsError } = await supabaseClient
      .from('leads')
      .select('id, name, sales_owner_id, reminder_at, last_notification_sent_at')
      .lte('reminder_at', now)
      .is('last_notification_sent_at', null) // Only where we haven't sent a notification yet (or logic to retry?)
    // Actually, we want to send if reminder_at > last_notification_sent_at OR last_notification_sent_at is null
    // But simple logic: if reminder_at is past, and we haven't sent it yet (or reset it).
    // When user updates reminder_at, we should probably RESET last_notification_sent_at to null? 
    // YES. That should be a trigger or manual update. For now assuming last_notification_sent_at is null if new reminder.

    if (leadsError) throw leadsError

    const notifications: any[] = []
    const processedLeadIds: string[] = []

    if (standardLeads && standardLeads.length > 0) {
      console.log(`Found ${standardLeads.length} standard leads to remind`)
      for (const lead of standardLeads) {
        if (!lead.sales_owner_id) continue // No one to notify

        notifications.push({
          user_id: lead.sales_owner_id,
          lead_id: lead.id,
          title: 'Lead Reminder',
          message: `Reminder for lead: ${lead.name}`,
          type: 'reminder',
          created_at: now
        })
        processedLeadIds.push(lead.id)
      }
    }

    // 2. Process Real Estate Leads
    const { data: realEstateLeads, error: reError } = await supabaseClient
      .from('leads_real_estate')
      .select('id, name, sales_owner_id, pre_sales_owner_id, post_sales_owner_id, reminder_at, last_notification_sent_at')
      .lte('reminder_at', now)
      .is('last_notification_sent_at', null)

    if (reError) throw reError

    const processedReLeadIds: string[] = []

    if (realEstateLeads && realEstateLeads.length > 0) {
      console.log(`Found ${realEstateLeads.length} RE leads to remind`)
      for (const lead of realEstateLeads) {
        // Determine who to notify. For RE, maybe multiple? Let's just notify sales_owner for now, or pre_sales if sales is null.
        // Requirement says "Assignee". Let's notify all attached owners?
        // "We shall get option to set a date & time... in the leads table" - usually the user setting it is the one viewing it.
        // But we can only notify the assigned owners.

        const ownersToNotify = new Set([lead.sales_owner_id, lead.pre_sales_owner_id, lead.post_sales_owner_id].filter(Boolean))

        ownersToNotify.forEach(ownerId => {
          notifications.push({
            user_id: ownerId,
            lead_id: lead.id,
            title: 'Lead Reminder',
            message: `Reminder for lead: ${lead.name}`,
            type: 'reminder',
            created_at: now
          })
        })
        if (ownersToNotify.size > 0) {
          processedReLeadIds.push(lead.id)
        }
      }
    }

    // 3. Insert Notifications
    if (notifications.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('notifications')
        .insert(notifications)

      if (insertError) throw insertError
      console.log(`Inserted ${notifications.length} notifications`)

      // 4. Update Leads to mark as sent
      if (processedLeadIds.length > 0) {
        await supabaseClient
          .from('leads')
          .update({ last_notification_sent_at: now })
          .in('id', processedLeadIds)
      }
      if (processedReLeadIds.length > 0) {
        await supabaseClient
          .from('leads_real_estate')
          .update({ last_notification_sent_at: now })
          .in('id', processedReLeadIds)
      }
    }

    return new Response(JSON.stringify({ success: true, processed: notifications.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
