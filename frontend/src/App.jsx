import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import Splash from './pages/Splash'
import Welcome from './pages/Welcome'
import Login from './pages/Login'
import SetPassword from './pages/SetPassword'
import Dashboard from './pages/Dashboard'
import Contacts from './pages/Contacts'
import History from './pages/History'
import SMS from './pages/SMS'
import Admins from './pages/Admins'
import Settings from './pages/Settings'
import ProtectedRoute from './routes/ProtectedRoute'
import RoleGuard from './routes/RoleGuard'
import { AuthProvider } from './context/AuthContext'
import Superadmin from './pages/Superadmin'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          {/* Set password page - no AppShell */}
          <Route path="/set-password" element={<SetPassword />} />
          
          {/* Main app routes - with AppShell */}
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/history" element={<History />} />
            <Route path="/sms" element={<SMS />} />
            <Route element={<RoleGuard roles={["superadmin"]} /> }>
              <Route path="/superadmin" element={<Superadmin />} />
              <Route path="/admins" element={<Admins />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

