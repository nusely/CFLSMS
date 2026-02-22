import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../api/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      // Handle magic link authentication from URL hash
      const { data: { session: hashSession } } = await supabase.auth.getSession()
      
      // Also check URL hash for magic link / invite tokens
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const isAuthHash = hashParams.get('access_token') || hashParams.get('type') === 'recovery' || hashParams.get('type') === 'invite'
        if (isAuthHash) {
          // Clear hash after processing, preserve query params (e.g. ?reset=true)
          const cleanUrl = window.location.pathname + window.location.search
          window.history.replaceState(null, '', cleanUrl)
        }
      }
      
      const { data } = await supabase.auth.getSession()
      setSession(data.session || hashSession)
      if (data.session?.user || hashSession?.user) {
        const u = (data.session || hashSession).user
        // Prefer role from DB profiles over user_metadata
        const { data: prof } = await supabase
          .from('profiles')
          .select('id,email,role')
          .eq('id', u.id)
          .single()
        setProfile({
          id: u.id,
          email: u.email,
          role: prof?.role || u.user_metadata?.role || 'admin',
        })
      } else {
        setProfile(null)
      }
      setLoading(false)
    }
    init()

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession)
      if (newSession?.user) {
        // If password was updated, refresh the session to get new metadata
        if (event === 'PASSWORD_RECOVERY' || event === 'USER_UPDATED' || event === 'USER_CREATED') {
          const { data: { session: refreshed } } = await supabase.auth.refreshSession()
          if (refreshed) {
            setSession(refreshed)
          }
        }
        
        const load = async () => {
          const u = newSession.user
          const { data: prof } = await supabase
            .from('profiles')
            .select('id,email,role')
            .eq('id', u.id)
            .single()
          setProfile({
            id: u.id,
            email: u.email,
            role: prof?.role || u.user_metadata?.role || 'admin',
          })
        }
        load()
      } else {
        setProfile(null)
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const value = useMemo(() => ({ session, profile, loading }), [session, profile, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}

