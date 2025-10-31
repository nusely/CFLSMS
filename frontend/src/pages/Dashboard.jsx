import { useAuthContext } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import { useScheduledList, useDeleteScheduled } from '../hooks/useSMS'
import { getContactsCount, getSmsCounts } from '../api/statsService'
import { Link } from 'react-router-dom'
import Toast from '../components/Toast'
import { formatDisplayE164, toE164Digits } from '../utils/formatPhone'

export default function Dashboard() {
  const { profile } = useAuthContext()
  const [to, setTo] = useState('')
  const [message, setMessage] = useState('')
  const [toast, setToast] = useState({ message: '', type: 'info' })
  const { data: scheduled = [] } = useScheduledList()
  const deleteScheduled = useDeleteScheduled()
  const [scheduledAt] = useState('')
  const [metrics, setMetrics] = useState({ total: 0, thisMonth: 0, today: 0, failed: 0 })
  const [contactsCount, setContactsCount] = useState(0)
  
  const handleDelete = async (id) => {
    if (!confirm('Delete this scheduled SMS?')) return
    try {
      await deleteScheduled.mutateAsync(id)
      setToast({ message: 'Scheduled SMS deleted', type: 'success' })
    } catch (err) {
      setToast({ message: err.message || 'Failed to delete', type: 'error' })
    }
  }

  // Load metrics once on mount (not on every render)
  useEffect(() => {
    import('../api/statsService').then(async () => {
      const [sms, cc] = await Promise.all([getSmsCounts(), getContactsCount()])
      setMetrics(sms); setContactsCount(cc)
    }).catch(()=>{})
  }, [])
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-500">Welcome{profile?.email ? `, ${profile.email}` : ''}</h2>
        <Link to="/sms" className="inline-block rounded-lg bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-500 text-white px-6 py-3 font-medium shadow-md hover:shadow-lg transition-all transform hover:scale-105">
          <i className="fas fa-paper-plane mr-2"></i>Send SMS
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm hover:shadow-lg transition-all transform hover:scale-105">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-600 font-medium">Total sent</div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <i className="fas fa-chart-line text-blue-600 text-lg"></i>
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-600">{metrics.total}</div>
        </div>
        <div className="rounded-xl border border-blue-300 bg-gradient-to-br from-blue-100 to-blue-50 p-5 shadow-sm hover:shadow-lg transition-all transform hover:scale-105">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-600 font-medium">This month</div>
            <div className="w-10 h-10 rounded-lg bg-blue-200 flex items-center justify-center">
              <i className="fas fa-calendar-alt text-blue-700 text-lg"></i>
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-700">{metrics.thisMonth}</div>
        </div>
        <div className="rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white p-5 shadow-sm hover:shadow-lg transition-all transform hover:scale-105">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-600 font-medium">Today</div>
            <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
              <i className="fas fa-clock text-cyan-600 text-lg"></i>
            </div>
          </div>
          <div className="text-3xl font-bold text-cyan-600">{metrics.today}</div>
        </div>
        <div className="rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-5 shadow-sm hover:shadow-lg transition-all transform hover:scale-105">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-600 font-medium">Contacts</div>
            <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
              <i className="fas fa-users text-sky-600 text-lg"></i>
            </div>
          </div>
          <div className="text-3xl font-bold text-sky-600">{contactsCount}</div>
        </div>
      </div>
      {scheduled.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-3 text-slate-800"><i className="fas fa-calendar-alt mr-2"></i>Scheduled</h3>
          <ul className="text-sm space-y-2">
            {scheduled.map(s => (
              <li key={s.id} className="flex justify-between items-center py-2 border-b border-slate-200 last:border-0">
                <span className="text-slate-700 font-medium">+{formatDisplayE164(s.recipient)}</span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">{new Date(s.scheduled_at).toLocaleString()}</span>
                  {s.status === 'pending' && (
                    <button onClick={() => handleDelete(s.id)} className="text-rose-600 hover:text-rose-700" title="Delete">
                      <i className="fas fa-trash"></i>
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Toast message={toast.message} type={toast.type} onClose={()=>setToast({ message: '', type: 'info' })} />
    </section>
  )
}

