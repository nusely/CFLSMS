import { useEffect, useState } from 'react'
import { getRecentFailures } from '../api/statsService'
import { Link } from 'react-router-dom'

export default function Superadmin() {
  const [failures, setFailures] = useState([])

  useEffect(() => {
    (async () => {
      const fails = await getRecentFailures(10)
      setFailures(fails)
    })().catch(() => {})
  }, [])

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-500">Superadmin</h2>
        <div className="flex gap-2">
          <Link to="/admins" className="rounded-lg bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-500 text-white px-4 py-2 text-sm font-medium"><i className="fas fa-user-shield mr-2"></i>Manage Admins</Link>
          <Link to="/sms" className="rounded-lg border border-blue-300 bg-white hover:bg-blue-50 text-blue-500 px-4 py-2 text-sm font-medium"><i className="fas fa-paper-plane mr-2"></i>Send SMS</Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-slate-800"><i className="fas fa-exclamation-triangle mr-2"></i>Recent Failures</h3>
            <Link to="/history" className="text-sm text-blue-500 hover:text-blue-500 font-medium">View all <i className="fas fa-arrow-right"></i></Link>
          </div>
          <ul className="text-sm space-y-2 max-h-72 overflow-auto">
            {failures.length === 0 && <li className="text-slate-500">None</li>}
            {failures.map((f, i) => (
              <li key={i} className="border border-slate-200 rounded-lg p-3 bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-slate-700">+{f.recipient}</span>
                  <span className="text-slate-500 text-xs">{new Date(f.created_at).toLocaleString()}</span>
                </div>
                <div className="text-slate-600 line-clamp-2">{f.message}</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold mb-3 text-slate-800"><i className="fas fa-cog mr-2"></i>System</h3>
          <ul className="text-sm space-y-2 text-slate-700">
            <li className="flex items-center gap-2"><i className="fas fa-check text-green-500"></i> Functions: send-sms, process-scheduled-sms, magic-link</li>
            <li className="flex items-center gap-2"><i className="fas fa-satellite-dish text-blue-500"></i> Provider: Fish Africa (Sender ID configured)</li>
            <li className="flex items-center gap-2"><i className="fas fa-mobile-alt text-blue-500"></i> Phone format: E.164 enforced</li>
          </ul>
        </div>
      </div>
    </section>
  )
}


