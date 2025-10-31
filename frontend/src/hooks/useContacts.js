import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addContact, deleteContact, listContacts, upsertContacts } from '../api/contactsService'

export function useContacts() {
  return useQuery({ 
    queryKey: ['contacts'], 
    queryFn: listContacts,
    staleTime: 60_000, // 1 minute - reduce refetch frequency
    refetchInterval: false, // Disable automatic polling
  })
}

export function useAddContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: addContact,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] })
  })
}

export function useUpsertContacts() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: upsertContacts,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] })
  })
}

export function useDeleteContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteContact,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] })
  })
}

