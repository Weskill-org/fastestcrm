import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from "../_shared/cors.ts";

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const now = new Date().toISOString()

    // 1. Process Standard Leads
    const { data: standardLeads, error: leadsError } = await supabaseClient
      .from('leads')
      .select('id, name, sales_owner_id, reminder_at, last_notification_sent_at, send_web_push')
      .lte('reminder_at', now)
      .is('last_notification_sent_at', null)

    if (leadsError) throw leadsError

    const notifications: any[] = []
    const processedLeadIds: string[] = []
    // Track users who should receive a push notification
    const pushTargets: Map<string, { title: string; body: string }> = new Map()

    if (standardLeads && standardLeads.length > 0) {
      console.log(`Found ${standardLeads.length} standard leads to remind`)
      for (const lead of standardLeads) {
        if (!lead.sales_owner_id) continue

        notifications.push({
          user_id: lead.sales_owner_id,
          lead_id: lead.id,
          title: 'Lead Reminder',
          message: `Reminder for lead: ${lead.name}`,
          type: 'reminder',
          created_at: now
        })
        processedLeadIds.push(lead.id)

        // Only queue push if the user opted in
        if (lead.send_web_push) {
          pushTargets.set(lead.sales_owner_id, {
            title: 'Lead Reminder',
            body: `Reminder for lead: ${lead.name}`,
          })
        }
      }
    }

    // 2. Process Real Estate Leads
    const { data: realEstateLeads, error: reError } = await supabaseClient
      .from('leads_real_estate')
      .select('id, name, sales_owner_id, pre_sales_owner_id, post_sales_owner_id, reminder_at, last_notification_sent_at, send_web_push')
      .lte('reminder_at', now)
      .is('last_notification_sent_at', null)

    if (reError) throw reError

    const processedReLeadIds: string[] = []

    if (realEstateLeads && realEstateLeads.length > 0) {
      console.log(`Found ${realEstateLeads.length} RE leads to remind`)
      for (const lead of realEstateLeads) {
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

          // Only queue push if user opted in
          if (lead.send_web_push) {
            pushTargets.set(ownerId!, {
              title: 'Lead Reminder',
              body: `Reminder for lead: ${lead.name}`,
            })
          }
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

    // 5. Send Web Push notifications for opted-in users
    let pushSent = 0
    for (const [userId, payload] of pushTargets) {
      try {
        const pushResponse = await fetch(`${supabaseUrl}/functions/v1/send-web-push`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({
            user_id: userId,
            title: payload.title,
            body: payload.body,
          }),
        })

        if (pushResponse.ok) {
          pushSent++
        } else {
          console.error(`Push failed for user ${userId}: ${pushResponse.status}`)
        }
      } catch (pushError) {
        console.error(`Error sending push to user ${userId}:`, pushError)
      }
    }

    console.log(`Push notifications sent: ${pushSent}/${pushTargets.size}`)

    return new Response(JSON.stringify({ 
      success: true, 
      notifications_created: notifications.length,
      pushes_sent: pushSent,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
