import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Splash() {
  const navigate = useNavigate()
  const [isSliding, setIsSliding] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSliding(true)
      // Navigate after slide animation completes
      setTimeout(() => {
        navigate('/welcome', { replace: true })
      }, 500) // Match animation duration (0.5s)
    }, 2000) // 2 seconds

    return () => clearTimeout(timer)
  }, [navigate])

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

