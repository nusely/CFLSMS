import { supabase } from './supabaseClient'

export async function getSmsCounts() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

  const total = await supabase.from('sms_history').select('*', { count: 'exact', head: true })
  const month = await supabase.from('sms_history').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth)
  const today = await supabase.from('sms_history').select('*', { count: 'exact', head: true }).gte('created_at', startOfDay)
  const failed = await supabase.from('sms_history').select('*', { count: 'exact', head: true }).eq('status', 'failed')

  return {
    total: total.count || 0,
    thisMonth: month.count || 0,
    today: today.count || 0,
    failed: failed.count || 0,
  }
}

export async function getContactsCount() {
  const res = await supabase.from('contacts').select('*', { count: 'exact', head: true })
  return res.count || 0
}

export async function getRecentFailures(limit = 10) {
  const { data, error } = await supabase
    .from('sms_history')
    .select('recipient,message,created_at,provider_response')
    .eq('status', 'failed')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}


