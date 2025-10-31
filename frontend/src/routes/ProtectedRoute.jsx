import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import Loader from '../components/Loader'
import { useState, useEffect } from 'react'
import { supabase } from '../api/supabaseClient'

export default function ProtectedRoute() {
  const { session, loading } = useAuthContext()
  const location = useLocation()
  const [checkingPassword, setCheckingPassword] = useState(true)
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false)

  useEffect(() => {
    const checkPasswordSetup = async () => {
      if (!session?.user) {
        setCheckingPassword(false)
        return
      }

      // Don't check if already on set-password page
      if (location.pathname === '/set-password') {
        setCheckingPassword(false)
        return
      }

      // Check if password has been set via user_metadata
      const passwordSet = session.user.user_metadata?.password_set === true
      
      // If password is already set, skip check (user can access app)
      if (passwordSet) {
        setCheckingPassword(false)
        return
      }

      // Get user profile to check role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      // SKIP password check for superadmin (they already have password)
      if (profile?.role === 'superadmin') {
        setCheckingPassword(false)
        return
      }

      // Check if this is a magic link login (via URL hash or query param)
      const hash = window.location.hash || ''
      const urlParams = new URLSearchParams(window.location.search)
      const isMagicLinkLogin = hash.includes('access_token') || hash.includes('type=recovery') || urlParams.get('reset') === 'true'
      
      // Only redirect to set-password if:
      // 1. User logged in via magic link AND password not set yet
      // This ensures existing users with passwords (normal login) aren't affected
      if (isMagicLinkLogin && !passwordSet) {
        setNeedsPasswordSetup(true)
      }
      
      setCheckingPassword(false)
    }

    if (!loading && session) {
      checkPasswordSetup()
    } else if (!loading && !session) {
      setCheckingPassword(false)
    }
  }, [session, loading, location.pathname])

  if (loading || checkingPassword) return <Loader />
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />
  if (needsPasswordSetup && location.pathname !== '/set-password') {
    return <Navigate to="/set-password" replace />
  }
  return <Outlet />
}

