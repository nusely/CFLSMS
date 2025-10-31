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
    const { to, message } = await req.json()
    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing `to` or `message`' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    const FISH_API_KEY = Deno.env.get('FISH_API_KEY')
    const FISH_APP_ID = Deno.env.get('FISH_APP_ID')
    const FISH_APP_SECRET = Deno.env.get('FISH_APP_SECRET')
    const FISH_BASE_URL = Deno.env.get('FISH_BASE_URL') || 'https://api.letsfish.africa'
    const FISH_SENDER_ID = Deno.env.get('FISH_SENDER_ID') || 'CFL'

    if (!FISH_API_KEY && !(FISH_APP_ID && FISH_APP_SECRET)) {
      return new Response(JSON.stringify({ error: 'Server not configured properly' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // --- Send SMS via Fish Africa API ---
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    const bearer = FISH_API_KEY || `${FISH_APP_ID}.${FISH_APP_SECRET}`
    headers['Authorization'] = `Bearer ${bearer}`

    // Initialize Supabase client first (before API call to avoid delays)
    const SUPABASE_URL = Deno.env.get('PROJECT_URL') || Deno.env.get('SUPABASE_URL')
    const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Missing Supabase configuration' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })

    // Get user ID from authorization header (JWT payload)
    const authHeader = req.headers.get('authorization')
    let ownerUserId = null
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '')
        // Decode JWT payload (base64url)
        const parts = token.split('.')
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
          ownerUserId = payload?.sub || null
        }
      } catch (e) {
        console.error('Failed to extract user ID from token:', e)
      }
    }

    // Send SMS via Fish Africa API with timeout
    let resp, result, msgId
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

      resp = await fetch(`${FISH_BASE_URL}/v1/sms`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ sender_id: FISH_SENDER_ID, message, recipients: [to] }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Parse response - handle both JSON and text
      const text = await resp.text()
      try {
        result = JSON.parse(text)
      } catch {
        result = { error: text, status: resp.status, statusText: resp.statusText }
      }

      msgId = Array.isArray(result?.data) 
        ? (result.data[0]?.message_id || result.data[0]?.reference || null)
        : (result?.message_id || result?.reference || null)

    } catch (fetchError: any) {
      // Network error, timeout, or fetch failure
      console.error('❌ Fish API fetch error:', fetchError)
      result = { 
        error: fetchError.name === 'AbortError' ? 'Request timeout (30s)' : fetchError.message,
        type: fetchError.name,
      }
      resp = { ok: false, status: 502 } as Response

      // Log failed attempt to database
      const insert = await supabase
        .from('sms_history')
        .insert({
          recipient: to,
          message,
          status: 'failed',
          delivery_status: 'failed',
          provider_response: result,
          message_id: null,
          owner_user_id: ownerUserId,
        })

      if (insert.error) {
        console.error('❌ Failed to log error to database:', insert.error)
      }

      return new Response(
        JSON.stringify({ 
          error: 'Failed to send SMS', 
          detail: result.error || fetchError.message,
          recipient: to,
        }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    // Always log to database (success or failure)
    // status: API response status (sent/failed)
    // delivery_status: Actual delivery status (pending until confirmed)
    const insert = await supabase
      .from('sms_history')
      .insert({
        recipient: to,
        message,
        status: resp.ok ? 'sent' : 'failed',
        delivery_status: resp.ok ? 'pending' : 'failed', // pending = needs delivery confirmation
        provider_response: result,
        message_id: msgId,
        owner_user_id: ownerUserId,
      })

    if (insert.error) {
      console.error('❌ Insert error:', insert.error)
      // Still return success if SMS was sent, just logging failed
      if (resp.ok) {
        return new Response(
          JSON.stringify({ 
            ok: true, 
            result, 
            warning: 'SMS sent but failed to log to database',
            detail: insert.error.message,
          }),
          { headers: { 'Content-Type': 'application/json', ...corsHeaders } },
        )
      }
    }

    if (!resp.ok) {
      const errorMsg = result?.message || result?.error || `HTTP ${resp.status}: ${resp.statusText || 'Unknown error'}`
      return new Response(
        JSON.stringify({ 
          error: 'SMS send failed', 
          detail: errorMsg,
          recipient: to,
          provider_response: result,
        }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    return new Response(
      JSON.stringify({ ok: true, result }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  } catch (e: any) {
    console.error('💥 Fatal error:', e)
    return new Response(
      JSON.stringify({ error: e.message || 'Unexpected error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  }
})
