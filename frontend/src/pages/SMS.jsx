import { useState, useMemo } from 'react'
import { toE164Digits, formatDisplayE164 } from '../utils/formatPhone'
import { useScheduleSMS, useSendSMS } from '../hooks/useSMS'
import { useContacts } from '../hooks/useContacts'
import { useContactLists, useGroupPhones } from '../hooks/useGroups'
import Toast from '../components/Toast'
import ProgressBar from '../components/ProgressBar'
import SearchableSelect from '../components/SearchableSelect'

export default function SMS() {
  const [recipients, setRecipients] = useState('') // Multiple recipients, one per line
  const [selectedContact, setSelectedContact] = useState('') // Single contact from dropdown
  const [selectedGroup, setSelectedGroup] = useState('') // Selected group ID
  const [inputMode, setInputMode] = useState('manual') // 'manual', 'contact', or 'group'
  const [message, setMessage] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [toast, setToast] = useState({ message: '', type: 'info' })
  const [isSending, setIsSending] = useState(false)
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0 })
  const send = useSendSMS()
  const schedule = useScheduleSMS()
  const { data: contacts = [] } = useContacts()
  const { data: groups = [] } = useContactLists()
  const { data: groupPhones = [] } = useGroupPhones(selectedGroup || null)

  const getRecipientPhones = () => {
    if (inputMode === 'group' && selectedGroup) {
      // Get phones from selected group - normalize to ensure clean format
      return groupPhones.map(p => toE164Digits(p)).filter(Boolean)
    }
    if (inputMode === 'contact' && selectedContact) {
      // Find contact by comparing IDs as strings (select value is always string)
      const contact = contacts.find(c => String(c.id) === String(selectedContact))
      return contact ? [toE164Digits(contact.phone)].filter(Boolean) : []
    }
    // Manual mode: split by newline, filter empty, validate E.164
    return recipients.split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .map(line => toE164Digits(line))
      .filter(phone => phone)
  }

  // Memoize options for SearchableSelect components to prevent hook order issues
  const groupOptions = useMemo(() => [
    { value: '', label: 'Select a group...' },
    ...groups.map(g => ({
      value: g.id,
      label: `${g.name} (${g.member_count || 0} contacts)`
    }))
  ], [groups])

  const contactOptions = useMemo(() => [
    { value: '', label: 'Select a contact...' },
    ...contacts.map(c => ({
      value: String(c.id),
      label: `${c.first_name} ${c.last_name} - ${formatDisplayE164(c.phone)}`
    }))
  ], [contacts])

  const onSubmit = async (e) => {
    e.preventDefault()
    const phones = getRecipientPhones()
    if (phones.length === 0) {
      setToast({ message: 'Please enter at least one valid recipient', type: 'error' })
      return
    }

    try {
      if (scheduledAt && new Date(scheduledAt) > new Date()) {
        // Schedule each recipient separately
        let scheduledCount = 0
        let failedCount = 0
        for (const phone of phones) {
          try {
            await schedule.mutateAsync({ recipient: phone, message, scheduledAt })
            scheduledCount++
          } catch (err) {
            failedCount++
            console.error(`Failed to schedule ${phone}:`, err)
          }
        }
        if (failedCount === 0) {
          setToast({ message: `SMS scheduled for ${scheduledCount} recipient(s)`, type: 'success' })
        } else {
          setToast({ message: `Scheduled ${scheduledCount}, failed: ${failedCount} recipient(s)`, type: 'error' })
        }
      } else {
        // Batch send in parallel (5 at a time for rate limiting)
        setIsSending(true)
        setSendProgress({ current: 0, total: phones.length })
        
        let successCount = 0
        let failedCount = 0
        const errors = []
        const BATCH_SIZE = 5 // Send 5 SMS in parallel at a time

            // Get all contacts for personalization (from both contacts list and group members)
            const allContacts = [...contacts]
            if (inputMode === 'group' && selectedGroup) {
              const { listMembers } = await import('../api/contactsService')
              const members = await listMembers(selectedGroup)
              // Add group members to contacts list if not already there
              members.forEach(m => {
                if (m.contacts && !allContacts.find(c => c.phone === m.contacts.phone)) {
                  allContacts.push(m.contacts)
                }
              })
            }

            // Process in batches
            for (let i = 0; i < phones.length; i += BATCH_SIZE) {
              const batch = phones.slice(i, i + BATCH_SIZE)
              
              // Send batch in parallel
              const batchPromises = batch.map(async (phone) => {
                try {
                  // Find contact for personalization
                  const contact = allContacts.find(c => c.phone === phone)
                  await send.mutateAsync({ to: phone, message, contact })
                  successCount++
                  setSendProgress(prev => ({ ...prev, current: prev.current + 1 }))
                  return { phone, success: true }
                } catch (err) {
                  failedCount++
                  errors.push({ phone, error: err.message || err.error || 'Failed to send' })
                  setSendProgress(prev => ({ ...prev, current: prev.current + 1 }))
                  console.error(`Failed to send to ${phone}:`, err)
                  return { phone, success: false, error: err }
                }
              })

          await Promise.all(batchPromises)
          
          // Small delay between batches to avoid rate limiting
          if (i + BATCH_SIZE < phones.length) {
            await new Promise(resolve => setTimeout(resolve, 300))
          }
        }

        setIsSending(false)

        if (failedCount === 0) {
          setToast({ message: `SMS sent to ${successCount} recipient(s)`, type: 'success' })
        } else if (successCount === 0) {
          setToast({ message: `Failed to send to all ${phones.length} recipient(s). Check console for details.`, type: 'error' })
        } else {
          setToast({ message: `Sent to ${successCount}, failed: ${failedCount} recipient(s)`, type: 'error' })
        }

        if (errors.length > 0) {
          console.error('Failed recipients:', errors)
        }
      }
      setRecipients('')
      setSelectedContact('')
      setSelectedGroup('')
      setMessage('')
    } catch (e1) {
      setToast({ message: e1.message || e1.error || 'Failed', type: 'error' })
      console.error('Submit error:', e1)
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-500">Send SMS</h2>
      <div className="flex justify-center">
        <form onSubmit={onSubmit} className="w-full max-w-xl rounded-xl border border-blue-200 bg-white p-6 space-y-4 shadow-lg">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <label className="block text-sm font-medium text-slate-700">Select Recipients</label>
              <div className="flex gap-2 text-xs">
                <button type="button" onClick={() => { setInputMode('manual'); setSelectedGroup(''); setSelectedContact('') }} className={`px-3 py-1 rounded ${inputMode === 'manual' ? 'bg-blue-400 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <i className="fas fa-keyboard mr-1"></i>Manual
                </button>
                <button type="button" onClick={() => { setInputMode('group'); setSelectedContact(''); setRecipients('') }} className={`px-3 py-1 rounded ${inputMode === 'group' ? 'bg-blue-400 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <i className="fas fa-layer-group mr-1"></i>Group
                </button>
                <button type="button" onClick={() => { setInputMode('contact'); setSelectedGroup(''); setRecipients('') }} className={`px-3 py-1 rounded ${inputMode === 'contact' ? 'bg-blue-400 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <i className="fas fa-user mr-1"></i>Single
                </button>
              </div>
            </div>
            
            {inputMode === 'group' ? (
              <div>
                <SearchableSelect
                  options={groupOptions}
                  value={selectedGroup}
                  onChange={(val) => setSelectedGroup(val)}
                  placeholder="Select a group..."
                />
                {selectedGroup && (
                  <div className="text-xs text-slate-500 mt-1">
                    Selected: {groups.find(g => g.id === selectedGroup)?.name} • {groupPhones.length} recipient(s)
                  </div>
                )}
              </div>
            ) : inputMode === 'contact' ? (
              <div>
                <SearchableSelect
                  options={contactOptions}
                  value={selectedContact}
                  onChange={(val) => setSelectedContact(val)}
                  placeholder="Select a contact..."
                />
                {selectedContact && (() => {
                  const contact = contacts.find(c => String(c.id) === String(selectedContact))
                  return contact ? (
                    <div className="text-xs text-slate-500 mt-1">
                      Selected: {contact.first_name} {contact.last_name} - {formatDisplayE164(contact.phone)} • {getRecipientPhones().length} recipient(s)
                    </div>
                  ) : null
                })()}
              </div>
            ) : (
              <div>
                <textarea 
                  value={recipients} 
                  onChange={(e) => setRecipients(e.target.value)}
                  placeholder={`233245678910\n233245678911\n233245678912`}
                  rows={6}
                  className="w-full rounded-lg bg-slate-50 border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-mono text-sm"
                />
                <div className="text-xs text-slate-500 mt-1">
                  Enter one phone number per line (E.164 format). Valid: {getRecipientPhones().length} recipient(s)
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700">Message</label>
            <textarea value={message} onChange={(e)=>setMessage(e.target.value)} rows={4} className="w-full rounded-lg bg-slate-50 border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900" />
            <div className="text-xs text-slate-500 mt-1">Use placeholders: {'{{first_name}}'}, {'{{last_name}}'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700">Schedule (optional)</label>
            <input type="datetime-local" value={scheduledAt} onChange={(e)=>setScheduledAt(e.target.value)} className="w-full rounded-lg bg-slate-50 border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900" />
          </div>
          {isSending && (
            <div className="w-full space-y-2">
              <ProgressBar 
                current={sendProgress.current} 
                total={sendProgress.total} 
                label="Sending SMS..."
              />
            </div>
          )}
          <button 
            disabled={(isSending || schedule.isPending) || getRecipientPhones().length === 0 || !message.trim()} 
            className="w-full rounded-lg bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-500 text-white px-4 py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <>Sending... {sendProgress.current}/{sendProgress.total}</>
            ) : schedule.isPending ? (
              'Scheduling…'
            ) : scheduledAt ? (
              <><i className="fas fa-calendar-alt mr-2"></i>Schedule for {getRecipientPhones().length} recipient(s)</>
            ) : (
              <><i className="fas fa-paper-plane mr-2"></i>Send to {getRecipientPhones().length} recipient(s)</>
            )}
          </button>
        </form>
      </div>
      <Toast message={toast.message} type={toast.type} onClose={()=>setToast({ message: '', type: 'info' })} />
    </section>
  )
}



