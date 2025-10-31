// deno-lint-ignore-file no-explicit-any
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { message_id } = await req.json()
    if (!message_id) return new Response(JSON.stringify({ error: 'message_id required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })

    // Provider config
    const FISH_API_KEY = Deno.env.get('FISH_API_KEY')
    const FISH_APP_ID = Deno.env.get('FISH_APP_ID')
    const FISH_APP_SECRET = Deno.env.get('FISH_APP_SECRET')
    const FISH_BASE_URL = Deno.env.get('FISH_BASE_URL') || 'https://api.letsfish.africa'
    const bearer = FISH_API_KEY || `${FISH_APP_ID}.${FISH_APP_SECRET}`
    if (!bearer) return new Response(JSON.stringify({ error: 'Provider auth not configured' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } })

    const resp = await fetch(`${FISH_BASE_URL}/v1/sms/${message_id}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${bearer}` },
    })
    const result = await resp.json().catch(() => ({}))

    // Update DB status
    const SUPABASE_URL = (Deno.env.get('PROJECT_URL') || Deno.env.get('SUPABASE_URL'))!
    const SERVICE_ROLE = (Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))!
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } })

    // Get provider status (can be: submitted, sent, delivered, failed, etc.)
    const providerStatus = (result?.data?.status || result?.status || '').toLowerCase()
    const providerDeliveryStatus = (result?.data?.delivery_status || result?.delivery_status || '').toLowerCase()
    
    // Map provider statuses to our normalized statuses
    // status: Only "sent" or "failed" - this indicates API acceptance
    // delivery_status: "pending", "delivered", "failed", or "unknown" - this indicates actual delivery
    
    // Normalize delivery status from provider response
    let deliveryStatus: string | null = null
    
    if (providerDeliveryStatus) {
      // Provider explicitly gives delivery status
      if (providerDeliveryStatus === 'delivered') {
        deliveryStatus = 'delivered'
      } else if (providerDeliveryStatus === 'failed' || providerDeliveryStatus === 'undelivered') {
        deliveryStatus = 'failed'
      } else if (providerDeliveryStatus === 'pending' || providerDeliveryStatus === 'submitted' || providerDeliveryStatus === 'sent') {
        deliveryStatus = 'pending' // Still waiting for delivery confirmation
      }
    } else if (providerStatus) {
      // Map provider status to delivery status
      if (providerStatus === 'delivered') {
        deliveryStatus = 'delivered'
      } else if (providerStatus === 'failed' || providerStatus === 'rejected' || providerStatus === 'undelivered') {
        deliveryStatus = 'failed'
      } else if (providerStatus === 'submitted' || providerStatus === 'sent' || providerStatus === 'queued') {
        // "submitted" and "sent" from provider mean API accepted it, but we're still waiting for delivery
        deliveryStatus = 'pending'
      }
    }
    
    // Only update delivery_status, NOT status
    // status should remain as originally set (sent/failed) - it only indicates if API accepted the request
    // delivery_status tracks whether the message was actually delivered to the recipient
    const updates: any = {}
    if (deliveryStatus) {
      updates.delivery_status = deliveryStatus
    }
    
    if (Object.keys(updates).length > 0) {
      await supabase.from('sms_history').update(updates).eq('message_id', message_id)
    }

    return new Response(JSON.stringify({ ok: resp.ok, result }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Unexpected error' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  }
})

