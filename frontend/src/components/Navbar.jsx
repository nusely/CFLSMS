import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../api/supabaseClient'
import { useAuthContext } from '../context/AuthContext'
import MobileSidebar from './MobileSidebar'

export default function Navbar() {
  const navigate = useNavigate()
  const { profile } = useAuthContext()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isSuperadmin = profile?.role === 'superadmin'

  const signOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <>
      <header className="w-full border-b border-blue-200 bg-white/80 backdrop-blur shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Hamburger menu button (mobile only, superadmin only) */}
            {isSuperadmin && (
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-blue-50 text-slate-600"
                aria-label="Open menu"
              >
                <i className="fas fa-bars text-xl"></i>
              </button>
            )}
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-500">CFL SMS</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden md:inline text-slate-600">{profile?.email}</span>
            <span className="hidden md:block rounded-full bg-gradient-to-r from-blue-400 to-blue-500 text-white px-3 py-1 text-xs font-medium capitalize">{profile?.role}</span>
            <button onClick={signOut} className="rounded-lg bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-500 text-white px-4 py-1.5 text-sm font-medium transition-colors">
              <i className="fas fa-sign-out-alt mr-1"></i>
              <span className="hidden md:inline">Sign out</span>
              <span className="md:hidden">Out</span>
            </button>
          </div>
        </div>
      </header>
      
      {/* Mobile Sidebar (superadmin only) */}
      {isSuperadmin && <MobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />}
    </>
  )
}

