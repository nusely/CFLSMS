import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../api/supabaseClient'
import { useAuthContext } from '../context/AuthContext'
import Loader from '../components/Loader'

export default function SetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [passwordJustSet, setPasswordJustSet] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { session } = useAuthContext()
  const isReset = searchParams.get('reset') === 'true'
  
  // Redirect if not authenticated or if password already set
  useEffect(() => {
    // Don't redirect if we just set the password and are about to redirect to dashboard
    if (passwordJustSet) return
    
    if (!session) {
      navigate('/login')
      return
    }

    // Check if password is already set - if yes, redirect to dashboard
    const passwordSet = session.user.user_metadata?.password_set === true
    if (passwordSet && !isReset) {
      navigate('/dashboard', { replace: true })
      return
    }

    // Check if superadmin (they shouldn't be on this page)
    const checkRole = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
      
      if (profile?.role === 'superadmin') {
        navigate('/dashboard', { replace: true })
      }
    }
    checkRole()
  }, [session, navigate, isReset, passwordJustSet])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      // Update password (with timeout - clock skew can cause hangs)
      const updatePromise = supabase.auth.updateUser({
        password: password,
        data: { password_set: true, password_set_at: new Date().toISOString() }
      })
      const timeoutMs = 15000
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out. Your device clock may be out of sync—please sync system time and try again.')), timeoutMs)
      )
      const { error: updateError } = await Promise.race([updatePromise, timeoutPromise])

      if (updateError) throw updateError

      // Mark password as just set to prevent useEffect redirects
      setPasswordJustSet(true)
      
      // Show success message
      setMessage('Password set successfully! Redirecting to dashboard...')
      setLoading(false)

      // Refresh session to pick up new metadata, then redirect to dashboard
      try {
        await supabase.auth.refreshSession()
      } catch {
        // Continue to dashboard even if refresh fails—password was set
      }
      setTimeout(() => { window.location.href = '/dashboard' }, 1000)

    } catch (err) {
      console.error('Password update error:', err)
      const errMsg = err?.message || ''
      const isClockError = errMsg.toLowerCase().includes('future') || errMsg.toLowerCase().includes('clock')
      const friendlyMessage = isClockError
        ? 'Your device clock may be out of sync. Please sync your system time (Settings → Time & Language) and try the invite link again.'
        : (errMsg || 'Failed to set password. Please try again.')
      setMessage(friendlyMessage)
      setLoading(false)
    }
  }

  if (!session) {
    return <Loader /> // Will redirect via useEffect
  }

  // Check if password already set (prevent re-access)
  const passwordSet = session.user.user_metadata?.password_set === true
  if (passwordSet && !isReset) {
    return <Loader /> // Will redirect via useEffect
  }

  return (
    <div className="min-h-[80vh] grid place-items-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 bg-white backdrop-blur border border-blue-200 p-6 rounded-xl shadow-xl">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-500">
          Set Your Password
        </h2>
        <p className="text-sm text-slate-600">
          Welcome! Please set a password for your account to continue.
        </p>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Password</label>
          <input 
            type="password" 
            className="w-full rounded-lg bg-slate-50 border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900" 
            value={password} 
            onChange={(e)=>setPassword(e.target.value)} 
            required 
            minLength={6}
            placeholder="At least 6 characters"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
          <input 
            type="password" 
            className="w-full rounded-lg bg-slate-50 border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900" 
            value={confirmPassword} 
            onChange={(e)=>setConfirmPassword(e.target.value)} 
            required 
            minLength={6}
            placeholder="Re-enter password"
          />
        </div>
        {message && (
          <div className={`text-sm p-2 rounded ${
            message.includes('success') 
              ? 'text-green-700 bg-green-50' 
              : 'text-rose-600 bg-rose-50'
          }`}>
            {message}
          </div>
        )}
        <button 
          disabled={loading || !password || !confirmPassword} 
          className="w-full rounded-lg bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-500 text-white px-4 py-2.5 disabled:opacity-50 transition-colors font-medium"
        >
          {loading ? 'Setting password...' : 'Set Password'}
        </button>
        {message && message.includes('success') ? (
          <div className="text-center">
            <a 
              href="/dashboard" 
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              Continue to Dashboard →
            </a>
          </div>
        ) : (
          <div className="text-center pt-1">
            <a 
              href="/login" 
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              Already have a password? Sign in →
            </a>
          </div>
        )}
      </form>
    </div>
  )
}

