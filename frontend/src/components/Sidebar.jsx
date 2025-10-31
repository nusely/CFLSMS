import { NavLink } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'

const linkClass = ({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${isActive ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-md' : 'text-slate-700 hover:bg-blue-50'}`

export default function Sidebar() {
  const { profile } = useAuthContext()
  const isSuperadmin = profile?.role === 'superadmin'

  return (
    <aside className="w-60 shrink-0 border-r border-blue-200 bg-white/80 backdrop-blur p-4 hidden md:block">
      <nav className="space-y-1">
        <NavLink to="/dashboard" className={linkClass}><i className="fas fa-chart-line w-4"></i> Dashboard</NavLink>
        <NavLink to="/sms" className={linkClass}><i className="fas fa-paper-plane w-4"></i> Send SMS</NavLink>
        <NavLink to="/contacts" className={linkClass}><i className="fas fa-users w-4"></i> Contacts</NavLink>
        <NavLink to="/history" className={linkClass}><i className="fas fa-history w-4"></i> History</NavLink>
        {isSuperadmin && <NavLink to="/superadmin" className={linkClass}><i className="fas fa-cog w-4"></i> Superadmin</NavLink>}
        {isSuperadmin && <NavLink to="/admins" className={linkClass}><i className="fas fa-user-shield w-4"></i> Admins</NavLink>}
        {isSuperadmin && <NavLink to="/settings" className={linkClass}><i className="fas fa-wrench w-4"></i> Settings</NavLink>}
      </nav>
    </aside>
  )
}

