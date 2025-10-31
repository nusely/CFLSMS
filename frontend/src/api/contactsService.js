import { supabase } from './supabaseClient'
import { toE164Digits } from '../utils/formatPhone'

export async function listContacts() {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function addContact(contact) {
  const normalized = toE164Digits(contact.phone)
  if (!normalized) throw new Error('Invalid phone number. Use international E.164 format.')
  const { data, error } = await supabase.from('contacts').insert({ first_name: contact.first_name, last_name: contact.last_name, phone: normalized, groups: contact.groups }).select().single()
  if (error) throw error
  return data
}

export async function upsertContacts(contacts) {
  const sanitized = contacts.map(c => {
    const normalized = toE164Digits(c.phone)
    if (!normalized) throw new Error(`Invalid phone: ${c.phone}`)
    return { first_name: c.first_name, last_name: c.last_name, phone: normalized, groups: c.groups }
  })
  const { data, error } = await supabase.from('contacts').upsert(sanitized, { onConflict: 'phone' }).select()
  if (error) throw error
  return data
}

// Contact Lists
export async function listContactLists() {
  const { data, error } = await supabase
    .from('contact_lists')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createContactList(name, isGlobal = false) {
  const { data: user } = await supabase.auth.getUser()
  if (!user?.user) throw new Error('Not authenticated')
  
  // Check if user is superadmin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.user.id)
    .single()
  
  // Only superadmins can create global groups
  const finalIsGlobal = profile?.role === 'superadmin' ? isGlobal : false
  
  const { data, error } = await supabase
    .from('contact_lists')
    .insert({ name, owner_user_id: user.user.id, is_global: finalIsGlobal })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateContactList(listId, updates) {
  const { data, error } = await supabase
    .from('contact_lists')
    .update(updates)
    .eq('id', listId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function addContactsToList(listId, contactIds) {
  // Filter out contacts that are already in the list to avoid conflicts
  const { data: existing, error: existingError } = await supabase
    .from('contact_list_members')
    .select('contact_id')
    .eq('list_id', listId)
    .in('contact_id', contactIds)
  
  if (existingError) throw existingError
  
  const existingIds = new Set(existing?.map(e => e.contact_id) || [])
  const newIds = contactIds.filter(id => !existingIds.has(id))
  
  if (newIds.length === 0) {
    // All contacts already in group - return empty array (not an error)
    return []
  }
  
  const rows = newIds.map(id => ({ list_id: listId, contact_id: id }))
  const { data, error } = await supabase
    .from('contact_list_members')
    .insert(rows)
    .select()
  if (error) {
    // Handle 409 conflict error more gracefully
    if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
      throw new Error('One or more contacts are already in this group')
    }
    throw error
  }
  return data
}

export async function listMembers(listId) {
  const { data, error } = await supabase
    .from('contact_list_members')
    .select('contact_id, contacts(*)')
    .eq('list_id', listId)
  if (error) throw error
  return data
}

// Get all phone numbers from a group
export async function getGroupPhones(listId) {
  const { data, error } = await supabase
    .from('contact_list_members')
    .select('contacts(phone)')
    .eq('list_id', listId)
  if (error) throw error
  return data.map(item => item.contacts?.phone).filter(Boolean)
}

// Get group with member count
export async function listContactListsWithCount() {
  const { data: lists, error } = await supabase
    .from('contact_lists')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  
  // Get member counts for each list
  const listsWithCount = await Promise.all(
    lists.map(async (list) => {
      const { count } = await supabase
        .from('contact_list_members')
        .select('*', { count: 'exact', head: true })
        .eq('list_id', list.id)
      return { ...list, member_count: count || 0 }
    })
  )
  
  return listsWithCount
}

export async function deleteContactList(listId) {
  const { error } = await supabase
    .from('contact_lists')
    .delete()
    .eq('id', listId)
  if (error) throw error
  return true
}

export async function deleteContact(id) {
  const { error } = await supabase.from('contacts').delete().eq('id', id)
  if (error) throw error
  return true
}

