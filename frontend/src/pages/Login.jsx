import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../api/supabaseClient'
import { useAuthContext } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // Password-only login; magic link is sent by superadmin via admin panel
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const { session, loading: authLoading } = useAuthContext()
  const from = location.state?.from?.pathname || '/dashboard'

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && session) {
      navigate(from, { replace: true })
    }
  }, [session, authLoading, navigate, from])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        // Provide more helpful error messages
        if (error.message.includes('Invalid login credentials') || error.message.includes('Email not confirmed')) {
          // Check if user exists and has password set
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single()
          
          if (profile) {
            // User exists but password might not be set yet
            throw new Error('Invalid password. If this is your first login, please use the magic link sent to your email by the superadmin to set your password.')
          } else {
            throw new Error('Invalid login credentials. Please contact the superadmin to receive an invitation.')
          }
        }
        throw error
      }
      navigate(from, { replace: true })
    } catch (err) {
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 bg-white backdrop-blur border border-blue-200 p-6 rounded-xl shadow-xl">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-500">Sign in</h2>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input 
            type="email" 
            autoComplete="username email"
            className="w-full rounded-lg bg-slate-50 border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900" 
            value={email} 
            onChange={(e)=>setEmail(e.target.value)} 
            required 
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Password</label>
          <input 
            type="password" 
            autoComplete="current-password"
            className="w-full rounded-lg bg-slate-50 border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900" 
            value={password} 
            onChange={(e)=>setPassword(e.target.value)} 
            required 
          />
        </div>
        {message && <div className="text-sm text-rose-600 bg-rose-50 p-2 rounded">{message}</div>}
        <div className="flex gap-2">
          <button disabled={loading} className="w-full rounded-lg bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-500 text-white px-4 py-2.5 disabled:opacity-50 transition-colors font-medium">{loading ? 'Please wait…' : 'Sign in'}</button>
        </div>
        <p className="text-xs text-slate-600">Forgot password? Contact the superadmin to receive a magic link.</p>
      </form>
      <div className="absolute bottom-[15vh] text-center text-sm text-slate-500">
        <span className="opacity-85">by </span>
        <span className="font-semibold">Cimons</span>
      </div>
    </div>
  )
}

