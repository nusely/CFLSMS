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
    const SUPABASE_URL = Deno.env.get('PROJECT_URL') || Deno.env.get('SUPABASE_URL')
    const SERVICE_ROLE = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY')
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return new Response(JSON.stringify({ error: 'Missing service role configuration' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)

    // Fetch due and pending messages (limit to avoid timeouts)
    const { data: due, error } = await supabase
      .from('scheduled_sms')
      .select('*')
      .lte('scheduled_at', new Date().toISOString())
      .eq('status', 'pending')
      .order('scheduled_at', { ascending: true })
      .limit(50)
    if (error) throw error

    // Fish API credentials
    const FISH_API_KEY = Deno.env.get('FISH_API_KEY')
    const FISH_APP_ID = Deno.env.get('FISH_APP_ID')
    const FISH_APP_SECRET = Deno.env.get('FISH_APP_SECRET')
    const FISH_BASE_URL = Deno.env.get('FISH_BASE_URL') || 'https://api.letsfish.africa'
    const FISH_SENDER_ID = Deno.env.get('FISH_SENDER_ID') || 'CFL'

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    const bearer = FISH_API_KEY || `${FISH_APP_ID}.${FISH_APP_SECRET}`
    headers['Authorization'] = `Bearer ${bearer}`

    for (const item of due || []) {
      try {
        // Personalize message using names if provided
        const personalized = (item.first_name || item.last_name)
          ? (item.message || '').replace(/\{\{\s*first_name\s*\}\}/gi, item.first_name || '')
                                .replace(/\{\{\s*last_name\s*\}\}/gi, item.last_name || '')
          : item.message
        const resp = await fetch(`${FISH_BASE_URL}/v1/sms`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ sender_id: FISH_SENDER_ID, message: personalized, recipients: [item.recipient] }),
        })
        const result = await resp.json().catch(() => ({}))
        // Log to history with owner_user_id
        const msgId = Array.isArray(result?.data) ? result.data[0]?.message_id : undefined
        await supabase.from('sms_history').insert({ 
          recipient: item.recipient, 
          message: personalized, 
          status: resp.ok ? 'sent' : 'failed',
          delivery_status: resp.ok ? 'pending' : 'failed', // pending until delivery confirmed
          provider_response: result, 
          message_id: msgId,
          owner_user_id: item.owner_user_id
        })
        // Update scheduled row
        await supabase
          .from('scheduled_sms')
          .update({ status: resp.ok ? 'sent' : 'failed', attempts: item.attempts + 1, last_error: resp.ok ? null : JSON.stringify(result) })
          .eq('id', item.id)
      } catch (e: any) {
        await supabase
          .from('scheduled_sms')
          .update({ status: 'failed', attempts: item.attempts + 1, last_error: e?.message || 'send error' })
          .eq('id', item.id)
      }
    }

    return new Response(JSON.stringify({ processed: due?.length || 0 }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Unexpected error' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  }
})

