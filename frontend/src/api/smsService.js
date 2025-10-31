import { supabase } from './supabaseClient'
import { toE164Digits } from '../utils/formatPhone'
import { applyPersonalization } from '../utils/template'

export async function sendSMS({ to, message, contact }) {
  const normalized = toE164Digits(to)
  if (!normalized) {
    throw new Error('Invalid phone number. Use international E.164 format, e.g. 233245678910')
  }
  const finalMessage = contact ? applyPersonalization(message, contact) : message
  const { data, error } = await supabase.functions.invoke('send-sms', {
    body: { to: normalized, message: finalMessage },
  })
  if (error) throw error
  return data
}

export async function fetchHistory() {
  const { data, error } = await supabase
    .from('sms_history')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function refreshStatus(messageId) {
  const { data, error } = await supabase.functions.invoke('check-sms-status', {
    body: { message_id: messageId },
  })
  if (error) throw error
  return data
}

