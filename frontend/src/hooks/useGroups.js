import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listContactListsWithCount, createContactList, deleteContactList, updateContactList, getGroupPhones, listMembers } from '../api/contactsService'

export function useContactLists() {
  return useQuery({ 
    queryKey: ['contact-lists'], 
    queryFn: listContactListsWithCount,
    staleTime: 60_000,
    refetchInterval: false,
  })
}

export function useCreateContactList() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ name, isGlobal = false }) => createContactList(name, isGlobal),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contact-lists'] })
  })
}

export function useDeleteContactList() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteContactList,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contact-lists'] })
      qc.invalidateQueries({ queryKey: ['contacts'] })
    }
  })
}

export function useUpdateContactList() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ listId, updates }) => updateContactList(listId, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contact-lists'] })
    }
  })
}

export function useGroupPhones(listId) {
  return useQuery({ 
    queryKey: ['group-phones', listId], 
    queryFn: () => getGroupPhones(listId),
    enabled: !!listId,
    staleTime: 60_000,
  })
}

export function useGroupMembers(listId) {
  return useQuery({ 
    queryKey: ['group-members', listId], 
    queryFn: () => listMembers(listId),
    enabled: !!listId,
    staleTime: 60_000,
  })
}

