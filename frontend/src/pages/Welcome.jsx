import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'

export default function Welcome() {
  const navigate = useNavigate()
  const { session, loading: authLoading } = useAuthContext()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // If already authenticated, redirect to dashboard immediately
    if (!authLoading && session) {
      navigate('/dashboard', { replace: true })
      return
    }
    
    // Trigger slide-in animation after component mounts
    setTimeout(() => setIsVisible(true), 50)
  }, [session, authLoading, navigate])

  const handleSignIn = () => {
    navigate('/login')
  }

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${isVisible ? 'animate-slide-in' : 'translate-x-full'}`}
      style={{
        background: 'linear-gradient(to bottom right, #1e3a8a 0%, #2563eb 50%, #60a5fa 75%, #ffffff 100%)',
        minHeight: '100vh',
        width: '100vw'
      }}
    >
      {/* Logo centered */}
      <div className="flex flex-col items-center justify-center flex-1">
        <img 
          src="/icons/icon-192x192.png" 
          alt="CFL SMS Logo" 
          className="w-32 h-32 mb-6 drop-shadow-2xl"
        />
        <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">CFL SMS</h1>
        <p className="text-white/90 text-lg mb-8">Bulk SMS Management System</p>
        <button
          onClick={handleSignIn}
          className="px-8 py-3 rounded-lg bg-white text-blue-600 font-semibold text-lg shadow-xl hover:bg-blue-50 transition-all transform hover:scale-105 active:scale-95"
        >
          <i className="fas fa-sign-in-alt mr-2"></i>Sign In
        </button>
      </div>
      
      {/* "by Cimons" at bottom */}
      <div className="mb-12 text-sm text-white/95 font-medium">
        <span className="opacity-85">by </span>
        <span className="font-semibold">Cimons</span>
      </div>
    </div>
  )
}

