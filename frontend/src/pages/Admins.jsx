import { useEffect, useState } from 'react'
import Table from '../components/Table'
import Toast from '../components/Toast'
import Loader from '../components/Loader'
import { listProfiles, sendMagicLink, updateUserRole, deleteUser } from '../api/adminsService'

export default function Admins() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [toast, setToast] = useState({ message: '', type: 'info' })

  const load = async () => {
    setLoading(true)
    try {
      const data = await listProfiles()
      setRows(data)
    } catch (e) {
      setToast({ message: e.message || 'Failed to load users', type: 'error' })
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const onInvite = async (e) => {
    e.preventDefault()
    try {
      await sendMagicLink(email)
      setToast({ message: 'Invitation sent (magic link)', type: 'success' })
      setEmail('')
      // user profile row will auto-create on first auth via trigger
    } catch (e) {
      setToast({ message: e.message || 'Failed to send invite', type: 'error' })
    }
  }

  const changeRole = async (userId, role) => {
    try {
      await updateUserRole(userId, role)
      setToast({ message: 'Role updated', type: 'success' })
      load()
    } catch (e) {
      setToast({ message: e.message || 'Failed to update role', type: 'error' })
    }
  }

  const onResendLink = async (email) => {
    try {
      await sendMagicLink(email)
      setToast({ message: `Magic link resent to ${email}`, type: 'success' })
    } catch (e) {
      setToast({ message: e.message || 'Failed to resend link', type: 'error' })
    }
  }

  const onDelete = async (userId, email) => {
    if (!confirm(`Are you sure you want to delete ${email}? This action cannot be undone.`)) {
      return
    }
    try {
      await deleteUser(userId)
      setToast({ message: 'User deleted successfully', type: 'success' })
      load()
    } catch (e) {
      setToast({ message: e.message || 'Failed to delete user', type: 'error' })
    }
  }

  const columns = [
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (r) => (
      <select value={r.role} onChange={(e)=>changeRole(r.id, e.target.value)} className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="admin">admin</option>
        <option value="superadmin">superadmin</option>
      </select>
    ) },
    { key: 'created_at', label: 'Created', render: (r) => new Date(r.created_at).toLocaleString() },
    { key: 'actions', label: 'Actions', render: (r) => (
      <div className="flex gap-2">
        <button
          onClick={() => onResendLink(r.email)}
          className="text-sm rounded-lg bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-500 text-white px-3 py-1.5 font-medium"
          title="Resend magic link invitation"
        >
          <i className="fas fa-envelope mr-1"></i>Resend Link
        </button>
        <button
          onClick={() => onDelete(r.id, r.email)}
          className="text-sm rounded-lg bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-500 text-white px-3 py-1.5 font-medium"
          title="Delete user"
        >
          <i className="fas fa-trash mr-1"></i>Delete
        </button>
      </div>
    ) },
  ]

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-500">Admins</h2>

      <form onSubmit={onInvite} className="rounded-xl border border-blue-200 bg-white p-4 flex gap-3 shadow-sm">
        <input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="user@example.com" className="flex-1 rounded-lg bg-slate-50 border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900" />
        <button className="rounded-lg bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-500 text-white px-4 py-2 font-medium"><i className="fas fa-envelope mr-2"></i>Send Invite</button>
      </form>

      {loading ? <Loader /> : <Table columns={columns} rows={rows} empty="No users" />}
      <Toast message={toast.message} type={toast.type} onClose={()=>setToast({ message: '', type: 'info' })} />
    </section>
  )
}

