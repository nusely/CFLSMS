import { supabase } from './supabaseClient'

export async function listProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,role,created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function updateUserRole(userId, role) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function sendMagicLink(email) {
  // Use frontend origin for redirect URL
  const redirectTo = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'
  const { data, error } = await supabase.functions.invoke('magic-link', {
    body: { email, redirectTo },
  })
  if (error) throw error
  return data
}

