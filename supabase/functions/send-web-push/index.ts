/**
 * send-web-push – Supabase Edge Function
 *
 * Sends a Web Push notification to all registered devices for a given user.
 * Called by process-reminders after inserting notification rows.
 *
 * Expects JSON body: { user_id, title, body, url? }
 *
 * Uses the standard Web Push protocol with VAPID authentication.
 * No npm dependencies – pure Deno / Web Crypto implementation.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// ─── VAPID Config ──────────────────────────────────────────────────────────────
const VAPID_PUBLIC_KEY = 'BAMW56PhO78oEncQJWP4crslrLPePPyQogP5Ac35QKPzh2MYOUV-HTuKW6LTEi5ZZdLPhZa64js4QSuTksxrtYg'
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
const VAPID_SUBJECT = 'mailto:support@fastestcrm.com'

// ─── Helpers ───────────────────────────────────────────────────────────────────

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(base64 + padding)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function concatUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, a) => sum + a.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0
  for (const arr of arrays) {
    result.set(arr, offset)
    offset += arr.length
  }
  return result
}

async function createVapidAuthHeader(audience: string): Promise<{ authorization: string; cryptoKey: string }> {
  const header = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const now = Math.floor(Date.now() / 1000)
  const payload = base64UrlEncode(
    new TextEncoder().encode(
      JSON.stringify({
        aud: audience,
        exp: now + 12 * 3600,
        sub: VAPID_SUBJECT,
      })
    )
  )

  const unsignedToken = `${header}.${payload}`

  // Import the private key
  const privateKeyBytes = base64UrlDecode(VAPID_PRIVATE_KEY)
  const key = await crypto.subtle.importKey(
    'pkcs8',
    await convertRawPrivateKeyToPkcs8(privateKeyBytes),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(unsignedToken)
  )

  // Convert DER signature to raw r||s format for JWT
  const rawSig = derToRaw(new Uint8Array(signature))
  const token = `${unsignedToken}.${base64UrlEncode(rawSig)}`

  return {
    authorization: `vapid t=${token}, k=${VAPID_PUBLIC_KEY}`,
    cryptoKey: `p256ecdsa=${VAPID_PUBLIC_KEY}`,
  }
}

// Convert raw 32-byte private key to PKCS#8 format for WebCrypto
async function convertRawPrivateKeyToPkcs8(rawKey: Uint8Array): Promise<ArrayBuffer> {
  // P-256 OID prefix for PKCS#8
  const pkcs8Header = new Uint8Array([
    0x30, 0x81, 0x87, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86,
    0x48, 0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d,
    0x03, 0x01, 0x07, 0x04, 0x6d, 0x30, 0x6b, 0x02, 0x01, 0x01, 0x04, 0x20,
  ])
  // After the private key, we omit the public key part (optional in PKCS8)
  const suffix = new Uint8Array([0xa1, 0x44, 0x03, 0x42, 0x00])

  // We need the public key. For simplicity, generate it from the private key.
  // Actually, for PKCS8, we can omit the public key part. Let's try a simpler structure.
  const der = new Uint8Array([
    0x30, 0x41, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86,
    0x48, 0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d,
    0x03, 0x01, 0x07, 0x04, 0x27, 0x30, 0x25, 0x02, 0x01, 0x01, 0x04, 0x20,
    ...rawKey,
  ])
  return der.buffer
}

function derToRaw(der: Uint8Array): Uint8Array {
  // If it's already 64 bytes, it's raw
  if (der.length === 64) return der

  // Parse DER sequence
  const raw = new Uint8Array(64)
  let offset = 2 // Skip SEQUENCE tag + length

  // First integer (r)
  if (der[offset] !== 0x02) return der // Not DER
  offset++
  let rLen = der[offset++]
  if (rLen === 33) offset++ // Skip leading zero
  raw.set(der.slice(offset, offset + 32), 0)
  offset += (rLen === 33) ? 32 : rLen

  // Second integer (s)
  if (der[offset] !== 0x02) return der
  offset++
  let sLen = der[offset++]
  if (sLen === 33) offset++ // Skip leading zero
  raw.set(der.slice(offset, offset + 32), 32)

  return raw
}

// ─── Main Handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id, title, body, url } = await req.json()

    if (!user_id || !title) {
      return new Response(JSON.stringify({ error: 'user_id and title are required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    if (!VAPID_PRIVATE_KEY) {
      console.error('VAPID_PRIVATE_KEY is not set')
      return new Response(JSON.stringify({ error: 'VAPID_PRIVATE_KEY not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all push subscriptions for this user
    const { data: subscriptions, error: subError } = await supabaseClient
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', user_id)

    if (subError) throw subError

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`No push subscriptions for user ${user_id}`)
      return new Response(JSON.stringify({ success: true, sent: 0, reason: 'no_subscriptions' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload = JSON.stringify({ title, body, url: url || '/' })
    let sent = 0
    const expiredIds: string[] = []

    for (const sub of subscriptions) {
      try {
        const endpointUrl = new URL(sub.endpoint)
        const audience = `${endpointUrl.protocol}//${endpointUrl.host}`
        const vapidHeaders = await createVapidAuthHeader(audience)

        const response = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'TTL': '86400',
            'Authorization': vapidHeaders.authorization,
            'Crypto-Key': vapidHeaders.cryptoKey,
          },
          body: payload,
        })

        if (response.status === 201 || response.status === 200) {
          sent++
        } else if (response.status === 404 || response.status === 410) {
          // Subscription expired or invalid – clean up
          expiredIds.push(sub.id)
          console.log(`Subscription expired: ${sub.endpoint}`)
        } else {
          console.error(`Push failed for ${sub.endpoint}: ${response.status} ${await response.text()}`)
        }
      } catch (pushError) {
        console.error(`Error sending push to ${sub.endpoint}:`, pushError)
      }
    }

    // Clean up expired subscriptions
    if (expiredIds.length > 0) {
      await supabaseClient
        .from('push_subscriptions')
        .delete()
        .in('id', expiredIds)
    }

    return new Response(JSON.stringify({ success: true, sent, expired: expiredIds.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('send-web-push error:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
