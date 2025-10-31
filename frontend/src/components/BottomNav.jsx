import { NavLink } from 'react-router-dom'

const linkClass = ({ isActive }) => `flex-1 flex flex-col items-center justify-center py-2 text-xs font-medium transition-colors ${isActive ? 'text-blue-500' : 'text-slate-600'}`

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-blue-200 bg-white/95 backdrop-blur shadow-lg">
      <div className="max-w-xl mx-auto flex">
        <NavLink to="/dashboard" className={linkClass}>
          <i className="fas fa-chart-line text-lg mb-0.5"></i>
          <span>Home</span>
        </NavLink>
        <NavLink to="/sms" className={linkClass}>
          <i className="fas fa-paper-plane text-lg mb-0.5"></i>
          <span>Send</span>
        </NavLink>
        <NavLink to="/contacts" className={linkClass}>
          <i className="fas fa-users text-lg mb-0.5"></i>
          <span>Contacts</span>
        </NavLink>
        <NavLink to="/history" className={linkClass}>
          <i className="fas fa-history text-lg mb-0.5"></i>
          <span>History</span>
        </NavLink>
      </div>
    </nav>
  )
}

