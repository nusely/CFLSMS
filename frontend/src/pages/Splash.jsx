import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'

export default function Splash() {
  const navigate = useNavigate()
  const { session, loading } = useAuthContext()
  const [isSliding, setIsSliding] = useState(false)

  useEffect(() => {
    if (loading) return // Wait for auth to load
    
    const timer = setTimeout(() => {
      setIsSliding(true)
      // Navigate after slide animation completes
      setTimeout(() => {
        // If user is logged in, skip to dashboard
        if (session) {
          navigate('/dashboard', { replace: true })
        } else {
          navigate('/welcome', { replace: true })
        }
      }, 500) // Match animation duration (0.5s)
    }, 3500) // 3.5 seconds

    return () => clearTimeout(timer)
  }, [navigate, session, loading])

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${isSliding ? 'animate-slide-out' : ''}`}
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
          className="w-32 h-32 mb-4 drop-shadow-2xl"
        />
      </div>
      
      {/* "by Cimons" at bottom */}
      <div className="mb-12 text-sm text-white/95 font-medium">
        <span className="opacity-85">by </span>
        <span className="font-semibold">Cimons</span>
      </div>
    </div>
  )
}

