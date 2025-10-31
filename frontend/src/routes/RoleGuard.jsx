import { Navigate, Outlet } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'

export default function RoleGuard({ roles = [] }) {
  const { profile, loading } = useAuthContext()
  if (loading) return <div className="p-6">Loading...</div>
  if (!roles.includes(profile?.role)) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

