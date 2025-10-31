import { supabase } from './supabaseClient'
import { toE164Digits } from '../utils/formatPhone'

export async function scheduleSMS({ recipient, message, scheduledAt }) {
  const normalized = toE164Digits(recipient)
  if (!normalized) throw new Error('Invalid phone number. Use E.164 format.')
  const user = (await supabase.auth.getUser()).data.user
  const { data, error } = await supabase
    .from('scheduled_sms')
    .insert({ owner_user_id: user.id, recipient: normalized, message, scheduled_at: scheduledAt })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function listScheduled() {
  const { data, error } = await supabase
    .from('scheduled_sms')
    .select('*')
    .order('scheduled_at', { ascending: true })
  if (error) throw error
  return data
}

export async function deleteScheduled(id) {
  const { error } = await supabase
    .from('scheduled_sms')
    .delete()
    .eq('id', id)
  if (error) throw error
}

