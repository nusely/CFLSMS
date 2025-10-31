import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'

const linkClass = ({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-base font-medium ${isActive ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-md' : 'text-slate-700 hover:bg-blue-50'}`

export default function MobileSidebar({ isOpen, onClose }) {
  const { profile } = useAuthContext()
  const isSuperadmin = profile?.role === 'superadmin'

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Side menu */}
      <aside 
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-blue-200">
            <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-500">Menu</h2>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-blue-50 text-slate-600"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            <NavLink to="/dashboard" className={linkClass} onClick={onClose}>
              <i className="fas fa-chart-line w-5"></i>
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/sms" className={linkClass} onClick={onClose}>
              <i className="fas fa-paper-plane w-5"></i>
              <span>Send SMS</span>
            </NavLink>
            <NavLink to="/contacts" className={linkClass} onClick={onClose}>
              <i className="fas fa-users w-5"></i>
              <span>Contacts</span>
            </NavLink>
            <NavLink to="/history" className={linkClass} onClick={onClose}>
              <i className="fas fa-history w-5"></i>
              <span>History</span>
            </NavLink>
            
            {isSuperadmin && (
              <>
                <div className="pt-4 mt-4 border-t border-blue-200">
                  <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Admin</div>
                </div>
                <NavLink to="/superadmin" className={linkClass} onClick={onClose}>
                  <i className="fas fa-cog w-5"></i>
                  <span>Superadmin</span>
                </NavLink>
                <NavLink to="/admins" className={linkClass} onClick={onClose}>
                  <i className="fas fa-user-shield w-5"></i>
                  <span>Admins</span>
                </NavLink>
                <NavLink to="/settings" className={linkClass} onClick={onClose}>
                  <i className="fas fa-wrench w-5"></i>
                  <span>Settings</span>
                </NavLink>
              </>
            )}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-blue-200 bg-slate-50">
            <div className="text-xs text-slate-600">
              <div className="font-medium mb-1 truncate">{profile?.email}</div>
              <div className="inline-block rounded-full bg-gradient-to-r from-blue-400 to-blue-500 text-white px-3 py-1 text-xs font-medium capitalize">
                {profile?.role}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

