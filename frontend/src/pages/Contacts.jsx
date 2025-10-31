import { useState, useEffect, useMemo } from 'react'
import { useContacts, useAddContact, useUpsertContacts, useDeleteContact } from '../hooks/useContacts'
import { useContactLists, useGroupMembers, useCreateContactList } from '../hooks/useGroups'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addContactsToList, deleteContact, updateContactList } from '../api/contactsService'
import ImportWizard from '../components/ImportWizard'
import { formatDisplayE164, toE164Digits } from '../utils/formatPhone'
import Table from '../components/Table'
import Toast from '../components/Toast'
import Loader from '../components/Loader'
import { useAuthContext } from '../context/AuthContext'
import SearchableSelect from '../components/SearchableSelect'

export default function Contacts() {
  const { profile } = useAuthContext()
  const isSuperadmin = profile?.role === 'superadmin'
  const { data = [], isLoading } = useContacts()
  const { data: groups = [] } = useContactLists()
  const addContact = useAddContact()
  const upsert = useUpsertContacts()
  const remove = useDeleteContact()
  const createGroup = useCreateContactList()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('') // Group to add new contact to
  const [toast, setToast] = useState({ message: '', type: 'info' })
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState(null)
  const [contactsToAdd, setContactsToAdd] = useState([]) // Selected contacts to add to group
  
  // Bulk selection state
  const [selectedContacts, setSelectedContacts] = useState([])
  const [showBulkGroupModal, setShowBulkGroupModal] = useState(false)
  const [bulkGroupName, setBulkGroupName] = useState('')
  const [bulkSelectedGroupId, setBulkSelectedGroupId] = useState(null)
  const [bulkIsGlobal, setBulkIsGlobal] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15
  const totalPages = Math.ceil(data.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = data.slice(startIndex, endIndex)
  
  // Reset to page 1 if current page is beyond available pages
  useEffect(() => {
    if (data.length > 0 && currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [data.length, totalPages, currentPage])
  
  const queryClient = useQueryClient()
  const addToGroup = useMutation({
    mutationFn: ({ listId, contactIds }) => addContactsToList(listId, contactIds),
    onSuccess: (data, variables) => {
      // Check if any contacts were actually added (data might be empty if all were duplicates)
      const addedCount = data?.length || 0
      const totalCount = variables.contactIds.length
      
      if (addedCount === 0) {
        setToast({ message: 'All selected contacts are already in this group', type: 'info' })
      } else if (addedCount < totalCount) {
        setToast({ message: `Added ${addedCount} of ${totalCount} contact(s). ${totalCount - addedCount} were already in the group.`, type: 'success' })
      } else {
        setToast({ message: `Added ${addedCount} contact(s) to group`, type: 'success' })
      }
      
      queryClient.invalidateQueries({ queryKey: ['contact-lists'] })
      queryClient.invalidateQueries({ queryKey: ['group-members'] })
      setShowGroupModal(false)
      setContactsToAdd([])
    },
    onError: (err) => {
      setToast({ message: err.message || 'Failed to add contacts to group', type: 'error' })
    }
  })
  
  const { data: groupMembers = [] } = useGroupMembers(selectedGroupId)

  const onAdd = async (e) => {
    e.preventDefault()
    try {
      const contact = await addContact.mutateAsync({ first_name: firstName, last_name: lastName, phone })
      
      // If a group is selected, add contact to that group
      if (selectedGroup) {
        const groupId = parseInt(selectedGroup)
        await addContactsToList(groupId, [contact.id])
        const groupName = groups.find(g => g.id === groupId)?.name || 'group'
        setToast({ message: `Contact added to "${groupName}" group`, type: 'success' })
        // Invalidate and refetch queries to refresh group member counts immediately
        await queryClient.invalidateQueries({ queryKey: ['contact-lists'] })
        await queryClient.invalidateQueries({ queryKey: ['group-members'] })
        await queryClient.refetchQueries({ queryKey: ['contact-lists'] })
      } else {
        setToast({ message: 'Contact added', type: 'success' })
      }
      
      setFirstName(''); setLastName(''); setPhone(''); setSelectedGroup('')
    } catch (err) {
      setToast({ message: err.message || 'Failed to add', type: 'error' })
    }
  }
  
  const handleAddContactsToGroup = () => {
    if (!selectedGroupId || contactsToAdd.length === 0) {
      setToast({ message: 'Please select a group and at least one contact', type: 'error' })
      return
    }
    addToGroup.mutate({ listId: selectedGroupId, contactIds: contactsToAdd })
  }

  const [wizardOpen, setWizardOpen] = useState(false)
  const [importIsGlobal, setImportIsGlobal] = useState(false)
  
  const onImportConfirm = async (rows, groupName) => {
    try {
      // Import contacts first
      const contacts = await upsert.mutateAsync(rows)
      
      // Create group and add contacts to it
      const { createContactList, addContactsToList } = await import('../api/contactsService')
      const group = await createContactList(groupName, importIsGlobal && isSuperadmin)
      const contactIds = contacts.map(c => c.id)
      if (contactIds.length > 0) {
        await addContactsToList(group.id, contactIds)
      }
      
      // Invalidate and refetch queries to refresh group member counts immediately
      await queryClient.invalidateQueries({ queryKey: ['contact-lists'] })
      await queryClient.invalidateQueries({ queryKey: ['group-members'] })
      await queryClient.refetchQueries({ queryKey: ['contact-lists'] })
      
      setToast({ message: `Imported ${contacts.length} contacts into "${groupName}" ${importIsGlobal && isSuperadmin ? 'global ' : ''}group`, type: 'success' })
      setImportIsGlobal(false)
    } catch (err) {
      setToast({ message: err.message || 'Import failed', type: 'error' })
      console.error('Import error:', err)
    } finally {
      setWizardOpen(false)
    }
  }

  // Handle bulk selection
  const toggleSelectAll = () => {
    const pageIds = paginatedData.map(c => c.id)
    const allSelected = pageIds.every(id => selectedContacts.includes(id))
    
    if (allSelected) {
      // Deselect all on current page
      setSelectedContacts(selectedContacts.filter(id => !pageIds.includes(id)))
    } else {
      // Select all on current page
      setSelectedContacts([...new Set([...selectedContacts, ...pageIds])])
    }
  }
  
  const toggleSelectContact = (contactId) => {
    if (selectedContacts.includes(contactId)) {
      setSelectedContacts(selectedContacts.filter(id => id !== contactId))
    } else {
      setSelectedContacts([...selectedContacts, contactId])
    }
  }
  
  // Bulk actions
  const handleBulkAddToGroup = async () => {
    if (selectedContacts.length === 0) {
      setToast({ message: 'Please select at least one contact', type: 'error' })
      return
    }
    
    try {
      let groupId
      
      if (bulkSelectedGroupId) {
        // Add to existing group
        groupId = typeof bulkSelectedGroupId === 'string' ? parseInt(bulkSelectedGroupId) : bulkSelectedGroupId
        await addContactsToList(groupId, selectedContacts)
        const groupName = groups.find(g => g.id === groupId)?.name || 'group'
        setToast({ message: `Added ${selectedContacts.length} contact(s) to "${groupName}"`, type: 'success' })
      } else if (bulkGroupName.trim()) {
        // Create new group and add contacts
        const newGroup = await createGroup.mutateAsync({ name: bulkGroupName.trim(), isGlobal: bulkIsGlobal })
        await addContactsToList(newGroup.id, selectedContacts)
        setToast({ message: `Created "${bulkGroupName}" ${bulkIsGlobal ? 'global ' : ''}group with ${selectedContacts.length} contact(s)`, type: 'success' })
      } else {
        setToast({ message: 'Please select a group or enter a new group name', type: 'error' })
        return
      }
      
      // Invalidate and refetch queries to refresh group member counts immediately
      await queryClient.invalidateQueries({ queryKey: ['contact-lists'] })
      await queryClient.invalidateQueries({ queryKey: ['group-members'] })
      // Force immediate refetch
      await queryClient.refetchQueries({ queryKey: ['contact-lists'] })
      
      setSelectedContacts([])
      setShowBulkGroupModal(false)
      setBulkGroupName('')
      setBulkSelectedGroupId(null)
    } catch (err) {
      setToast({ message: err.message || 'Failed to add contacts to group', type: 'error' })
    }
  }
  
  const handleBulkDelete = async () => {
    if (selectedContacts.length === 0) {
      setToast({ message: 'Please select at least one contact', type: 'error' })
      return
    }
    
    if (!confirm(`Are you sure you want to delete ${selectedContacts.length} contact(s)? This action cannot be undone.`)) {
      return
    }
    
    try {
      // Delete contacts in parallel
      await Promise.all(selectedContacts.map(id => deleteContact(id)))
      setToast({ message: `Deleted ${selectedContacts.length} contact(s)`, type: 'success' })
      setSelectedContacts([])
      // Refresh contacts list
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    } catch (err) {
      setToast({ message: err.message || 'Failed to delete contacts', type: 'error' })
    }
  }
  
  const columns = [
    { 
      key: 'select', 
      label: (
        <input
          type="checkbox"
          checked={paginatedData.length > 0 && paginatedData.every(c => selectedContacts.includes(c.id))}
          onChange={toggleSelectAll}
          className="rounded border-slate-300"
          title="Select all on this page"
        />
      ),
      render: (r) => (
        <input
          type="checkbox"
          checked={selectedContacts.includes(r.id)}
          onChange={() => toggleSelectContact(r.id)}
          className="rounded border-slate-300"
        />
      )
    },
    { key: 'first_name', label: 'First name' },
    { key: 'last_name', label: 'Last name' },
    { key: 'phone', label: 'Phone', render: (r) => formatDisplayE164(r.phone) },
    { key: 'actions', label: '', render: (r) => (
      <button onClick={() => remove.mutateAsync(r.id)} className="text-rose-600 hover:text-rose-700 font-medium"><i className="fas fa-trash mr-1"></i>Delete</button>
    )},
  ]
  
  const handleToggleGlobal = async (groupId, currentIsGlobal) => {
    try {
      await updateContactList(groupId, { is_global: !currentIsGlobal })
      setToast({ message: `Group ${!currentIsGlobal ? 'marked as global' : 'marked as private'}`, type: 'success' })
      queryClient.invalidateQueries({ queryKey: ['contact-lists'] })
    } catch (err) {
      setToast({ message: err.message || 'Failed to update group', type: 'error' })
    }
  }

  const groupColumns = [
    { key: 'name', label: 'Group Name' },
    { 
      key: 'is_global', 
      label: 'Status', 
      className: isSuperadmin ? '' : 'hidden',
      render: (r) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          r.is_global ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
        }`}>
          {r.is_global ? 'Global' : 'Private'}
        </span>
      )
    },
    { key: 'member_count', label: 'Members', render: (r) => r.member_count || 0 },
    { key: 'created_at', label: 'Created', render: (r) => new Date(r.created_at).toLocaleDateString() },
    { key: 'actions', label: '', render: (r) => {
      // Check if this is a global group owned by superadmin
      // For admins, only show Manage for their own groups
      const isGlobalGroup = r.is_global === true
      const canManage = isSuperadmin || !isGlobalGroup
      
      return (
        <div className="flex gap-2 items-center">
          {isSuperadmin && (
            <button
              onClick={() => handleToggleGlobal(r.id, r.is_global)}
              className="text-xs px-2 py-1 rounded border border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium"
              title={r.is_global ? 'Make private' : 'Make global'}
            >
              <i className={`fas ${r.is_global ? 'fa-globe' : 'fa-lock'} mr-1`}></i>
              {r.is_global ? 'Make Private' : 'Make Global'}
            </button>
          )}
          {canManage ? (
            <button 
              onClick={() => {
                setSelectedGroupId(r.id)
                setShowGroupModal(true)
              }} 
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              <i className="fas fa-user-plus mr-1"></i>Manage
            </button>
          ) : (
            <span className="text-xs text-slate-500 italic" title="Global groups can only be managed by superadmin">
              <i className="fas fa-globe mr-1"></i>Global
            </span>
          )}
        </div>
      )
    }},
  ]

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-500">Contacts</h2>

      <form onSubmit={onAdd} className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm grid gap-3 md:grid-cols-5">
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700">First name</label>
          <input value={firstName} onChange={(e)=>setFirstName(e.target.value)} className="w-full rounded-lg bg-slate-50 border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700">Last name</label>
          <input value={lastName} onChange={(e)=>setLastName(e.target.value)} className="w-full rounded-lg bg-slate-50 border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700">Phone (E.164)</label>
          <input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="233245678910" className="w-full rounded-lg bg-slate-50 border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900" />
          <div className="text-xs text-slate-500 mt-1">{formatDisplayE164(phone) || ''}</div>
        </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Add to Group (optional)</label>
              <SearchableSelect
                options={useMemo(() => [
                  { value: '', label: 'None' },
                  ...groups.filter(g => {
                    // Admins can only add to their own groups (not global groups)
                    const canUseGroup = isSuperadmin || !g.is_global
                    return canUseGroup
                  }).map(g => ({
                    value: g.id,
                    label: `${g.name}${g.is_global ? ' (Global)' : ''}`
                  }))
                ], [groups, isSuperadmin])}
                value={selectedGroup}
                onChange={(val) => setSelectedGroup(val)}
                placeholder="None"
              />
            </div>
        <div className="flex items-end">
          <button disabled={!toE164Digits(phone)} className="rounded-lg bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-500 text-white px-3 py-2 disabled:opacity-50 w-full font-medium">Add</button>
        </div>
      </form>

      {/* Groups Section - Moved to Top */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-800"><i className="fas fa-layer-group mr-2"></i>Groups</h3>
        </div>
        {groups.length === 0 ? (
          <div className="rounded-xl border border-blue-200 bg-white p-6 text-center text-slate-500">
            <i className="fas fa-layer-group text-4xl mb-3 text-slate-300"></i>
            <p>No groups yet. Import contacts with a group name to create your first group.</p>
          </div>
        ) : (
          <Table columns={groupColumns} rows={groups} empty="No groups" />
        )}
      </div>

      {/* Contacts Section */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-800">
            All Contacts {selectedContacts.length > 0 && `(${selectedContacts.length} selected)`}
          </h3>
          <button onClick={()=>setWizardOpen(true)} className="text-sm rounded-lg bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-500 text-white px-4 py-2 font-medium"><i className="fas fa-file-upload mr-2"></i>Import CSV</button>
        </div>
        
        {/* Bulk Actions Toolbar */}
        {selectedContacts.length > 0 && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm mb-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="text-sm font-medium text-slate-700">
                <i className="fas fa-check-circle mr-2 text-blue-500"></i>
                {selectedContacts.length} contact(s) selected
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setShowBulkGroupModal(true)}
                  className="text-sm rounded-lg bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-500 text-white px-4 py-2 font-medium"
                >
                  <i className="fas fa-layer-group mr-2"></i>Add to Group
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="text-sm rounded-lg bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 font-medium"
                >
                  <i className="fas fa-trash mr-2"></i>Delete Selected
                </button>
                <button
                  onClick={() => setSelectedContacts([])}
                  className="text-sm rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 font-medium"
                >
                  <i className="fas fa-times mr-2"></i>Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}
        
        {isLoading ? <Loader /> : (
          <>
            <Table columns={columns} rows={paginatedData} empty="No contacts" />
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of {data.length} contacts
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    title="Previous page"
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium ${
                              currentPage === page
                                ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white'
                                : 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <span key={page} className="px-2 text-slate-400">
                            ...
                          </span>
                        )
                      }
                      return null
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    title="Next page"
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Add Contacts to Group Modal */}
      {showGroupModal && selectedGroupId && (() => {
        const selectedGroup = groups.find(g => g.id === selectedGroupId)
        const isGlobalGroup = selectedGroup?.is_global === true
        const canManageGroup = isSuperadmin || !isGlobalGroup
        
        if (!canManageGroup) {
          return null // Don't show modal if admin tries to manage global group
        }
        
        return (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-3xl rounded-xl border border-blue-200 bg-white shadow-xl p-6 max-h-[80vh] overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-500">
                  Add Contacts to "{selectedGroup?.name}"
                  {isGlobalGroup && (
                    <span className="ml-2 text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 font-normal">Global</span>
                  )}
                </h3>
              <button onClick={() => { setShowGroupModal(false); setSelectedGroupId(null); setContactsToAdd([]) }} className="text-slate-600 hover:text-slate-900">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-3">
                  Select contacts to add to this group. Current members: {groupMembers.length}
                </p>
                <div className="max-h-96 overflow-auto border border-slate-300 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-blue-400 to-blue-500 text-white sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2">
                          <input
                            type="checkbox"
                            checked={(() => {
                              const memberIds = groupMembers.map(m => m.contact_id)
                              const availableContacts = data.filter(c => !memberIds.includes(c.id))
                              return contactsToAdd.length === availableContacts.length && availableContacts.length > 0
                            })()}
                            onChange={(e) => {
                              if (e.target.checked) {
                                // Exclude contacts already in group
                                const memberIds = groupMembers.map(m => m.contact_id)
                                setContactsToAdd(data.filter(c => !memberIds.includes(c.id)).map(c => c.id))
                              } else {
                                setContactsToAdd([])
                              }
                            }}
                            className="rounded border-slate-300"
                          />
                        </th>
                        <th className="text-left px-3 py-2">First Name</th>
                        <th className="text-left px-3 py-2">Last Name</th>
                        <th className="text-left px-3 py-2">Phone</th>
                        <th className="text-left px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map(contact => {
                        const isInGroup = groupMembers.some(m => m.contact_id === contact.id)
                        const isSelected = contactsToAdd.includes(contact.id)
                        return (
                          <tr key={contact.id} className={`odd:bg-slate-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={isInGroup}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setContactsToAdd([...contactsToAdd, contact.id])
                                  } else {
                                    setContactsToAdd(contactsToAdd.filter(id => id !== contact.id))
                                  }
                                }}
                                className="rounded border-slate-300"
                              />
                            </td>
                            <td className="px-3 py-2">{contact.first_name}</td>
                            <td className="px-3 py-2">{contact.last_name}</td>
                            <td className="px-3 py-2 font-mono text-xs">{formatDisplayE164(contact.phone)}</td>
                            <td className="px-3 py-2">
                              {isInGroup ? (
                                <span className="text-xs text-green-600"><i className="fas fa-check-circle mr-1"></i>In Group</span>
                              ) : (
                                <span className="text-xs text-slate-500">Not in group</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  onClick={() => { setShowGroupModal(false); setSelectedGroupId(null); setContactsToAdd([]) }}
                  className="rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddContactsToGroup}
                  disabled={contactsToAdd.length === 0 || addToGroup.isPending}
                  className="rounded-lg bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-500 text-white px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addToGroup.isPending ? 'Adding...' : `Add ${contactsToAdd.length} Contact(s)`}
                </button>
              </div>
            </div>
          </div>
        </div>
        )
      })()}
      
      {/* Bulk Add to Group Modal */}
      {showBulkGroupModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-blue-200 bg-white shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-500">
                Add {selectedContacts.length} Contact(s) to Group
              </h3>
              <button 
                onClick={() => {
                  setShowBulkGroupModal(false)
                  setBulkGroupName('')
                  setBulkSelectedGroupId(null)
                }} 
                className="text-slate-600 hover:text-slate-900"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700">
                  Select Existing Group
                </label>
                <SearchableSelect
                  options={useMemo(() => [
                    { value: '', label: 'Choose existing group...' },
                    ...groups.filter(g => {
                      // Only show groups that admins can add to (their own groups, not global groups owned by superadmin)
                      const canUseGroup = isSuperadmin || !g.is_global
                      return canUseGroup
                    }).map(g => ({
                      value: g.id,
                      label: `${g.name} (${g.member_count || 0} members)${g.is_global ? ' [Global]' : ''}`
                    }))
                  ], [groups, isSuperadmin])}
                  value={bulkSelectedGroupId || ''}
                  onChange={(val) => {
                    setBulkSelectedGroupId(val ? val : null)
                    if (val) setBulkGroupName('') // Clear new group name if selecting existing
                  }}
                  placeholder="Choose existing group..."
                />
                {!isSuperadmin && groups.some(g => g.is_global) && (
                  <p className="text-xs text-slate-500 mt-1">
                    <i className="fas fa-info-circle mr-1"></i>Global groups cannot be modified. Only your own groups are listed.
                  </p>
                )}
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">OR</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700">
                  Create New Group
                </label>
                <input
                  type="text"
                  value={bulkGroupName}
                  onChange={(e) => {
                    setBulkGroupName(e.target.value)
                    if (e.target.value) setBulkSelectedGroupId(null) // Clear existing group selection if typing new name
                  }}
                  placeholder="Enter new group name..."
                  className="w-full rounded-lg bg-slate-50 border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
                {isSuperadmin && (
                  <label className="flex items-center mt-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={bulkIsGlobal}
                      onChange={(e) => setBulkIsGlobal(e.target.checked)}
                      className="mr-2 rounded border-slate-300"
                    />
                    <i className="fas fa-globe mr-1 text-blue-500"></i>
                    Make this a global group (visible to all admins)
                  </label>
                )}
              </div>
              
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  onClick={() => {
                    setShowBulkGroupModal(false)
                    setBulkGroupName('')
                    setBulkSelectedGroupId(null)
                    setBulkIsGlobal(false)
                  }}
                  className="rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkAddToGroup}
                  disabled={!bulkSelectedGroupId && !bulkGroupName.trim() || createGroup.isPending}
                  className="rounded-lg bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-500 text-white px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createGroup.isPending ? 'Processing...' : 'Add to Group'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <ImportWizard 
        open={wizardOpen} 
        onClose={()=>{
          setWizardOpen(false)
          setImportIsGlobal(false)
        }} 
        onConfirm={onImportConfirm}
        isSuperadmin={isSuperadmin}
        isGlobal={importIsGlobal}
        onGlobalChange={setImportIsGlobal}
      />
      <Toast message={toast.message} type={toast.type} onClose={()=>setToast({ message: '', type: 'info' })} />
    </section>
  )
}

