import { supabase } from '../api/supabaseClient'
import { useAuthContext } from '../context/AuthContext'

export function useAuth() {
  const { session, profile, loading } = useAuthContext()

  const signInWithPassword = async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const sendMagicLink = async ({ email }) => {
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin }})
    if (error) throw error
  }

  return { session, profile, loading, signInWithPassword, sendMagicLink }
}

