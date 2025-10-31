import { useState } from 'react'
import { useSMSHistory, useRefreshStatus } from '../hooks/useSMS'
import Toast from '../components/Toast'
import Table from '../components/Table'
import Loader from '../components/Loader'

export default function History() {
  const { data = [], isLoading } = useSMSHistory()
  const refresh = useRefreshStatus()
  const [refreshingId, setRefreshingId] = useState(null)
  
  const handleRefresh = async (messageId) => {
    setRefreshingId(messageId)
    try {
      await refresh.mutateAsync(messageId)
    } finally {
      // Small delay to ensure animation is visible
      setTimeout(() => setRefreshingId(null), 300)
    }
  }
  const columns = [
    { key: 'recipient', label: 'To' },
    { key: 'message', label: 'Message' },
    { key: 'status', label: 'API Status', render: (r) => {
      // Normalize status display - remove "submitted", show only "sent" or "failed"
      const displayStatus = r.status === 'submitted' ? 'sent' : (r.status || 'unknown')
      return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          displayStatus === 'sent' ? 'bg-green-100 text-green-700' : 
          displayStatus === 'failed' ? 'bg-rose-100 text-rose-700' : 
          'bg-slate-100 text-slate-700'
        }`} title={displayStatus === 'sent' ? 'API accepted the message' : displayStatus === 'failed' ? 'API rejected the message' : ''}>
          {displayStatus}
        </span>
      )
    } },
    { key: 'delivery_status', label: 'Delivery Status', render: (r) => {
      const deliveryStatus = r.delivery_status || 'unknown'
      // Only show refresh button if delivery is pending and message was sent (not failed)
      const canRefresh = deliveryStatus === 'pending' && r.message_id && r.status !== 'failed'
      const isRefreshing = refreshingId === r.message_id
      return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          deliveryStatus === 'delivered' ? 'bg-green-100 text-green-700' : 
          deliveryStatus === 'failed' ? 'bg-rose-100 text-rose-700' : 
          deliveryStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
          'bg-slate-100 text-slate-700'
        }`} title={
          deliveryStatus === 'delivered' ? 'Message was delivered to recipient' :
          deliveryStatus === 'pending' ? 'Waiting for delivery confirmation - click refresh to check' :
          deliveryStatus === 'failed' ? 'Delivery failed' :
          'Unknown delivery status'
        }>
          {deliveryStatus === 'pending' ? 'Waiting...' : deliveryStatus}
          {canRefresh && (
            <button 
              onClick={() => handleRefresh(r.message_id)}
              disabled={isRefreshing}
              className="ml-2 text-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Check if message was delivered"
            >
              <i className={`fas fa-sync-alt text-xs ${isRefreshing ? 'animate-spin' : ''}`}></i>
            </button>
          )}
        </span>
      )
    } },
    { key: 'message_id', label: 'Message ID', className: 'hidden md:table-cell', render: (r) => (
      <div className="flex items-center gap-2">
        <span className="truncate max-w-[160px] text-slate-700" title={r.message_id}>{r.message_id || '-'}</span>
        {r.message_id && (
          <button className="text-xs text-blue-500 hover:text-blue-400 font-medium" onClick={()=>navigator.clipboard.writeText(r.message_id)}><i className="fas fa-copy mr-1"></i>Copy</button>
        )}
      </div>
    ) },
    { key: 'created_at', label: 'When', render: (r) => new Date(r.created_at).toLocaleString() },
    { key: 'actions', label: '', className: 'hidden md:table-cell', render: (r) => {
      const canRefresh = r.message_id && r.status !== 'failed' && (r.delivery_status === 'pending' || !r.delivery_status)
      const isRefreshing = refreshingId === r.message_id
      return canRefresh ? (
        <button 
          onClick={() => handleRefresh(r.message_id)} 
          disabled={isRefreshing}
          className="text-xs rounded-lg border border-blue-300 bg-blue-50 text-blue-500 hover:bg-blue-100 px-3 py-1 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          title="Check if message was delivered"
        >
          <i className={`fas fa-sync-alt mr-1 ${isRefreshing ? 'animate-spin' : ''}`}></i>
          {isRefreshing ? 'Checking...' : 'Check Delivery'}
        </button>
      ) : null
    } },
  ]
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-500">SMS History</h2>
      {isLoading ? <Loader /> : <Table columns={columns} rows={data} empty="No history yet" />}
      <Toast message={refresh.isError ? 'Refresh failed' : ''} type="error" onClose={()=>{}} />
    </section>
  )
}

